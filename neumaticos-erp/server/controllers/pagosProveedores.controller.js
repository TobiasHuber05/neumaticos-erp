import { prisma } from '../lib/prisma.js';

// GET /api/pagos-proveedores
export const getPagos = async (req, res) => {
  try {
    const pagos = await prisma.orden_pago_proveedores.findMany({
      include: {
        proveedores: true,
        orden_pago_forma_pago: {
          include: { forma_pago: true }
        },
        detalle_orden_pago_facturas: {
          include: { factura_compra: true }
        }
      },
      orderBy: { id_orden_pago: 'desc' }
    });

    const data = pagos.map((op) => ({
      id: op.id_orden_pago,
      numero: `OP-${String(op.id_orden_pago).padStart(4, '0')}`,
      proveedorId: op.id_proveedor,
      fecha: op.fecha_pago?.toISOString().split('T')[0] ?? '—',
      medios: op.orden_pago_forma_pago.map((m) => ({
        medio: m.forma_pago?.metodo_pago ?? '—',
        monto: Number(m.monto ?? 0),
      })),
      facturaIds: op.detalle_orden_pago_facturas.map((d) => d.id_factura_compra),
      total: op.orden_pago_forma_pago.reduce((acc, m) => acc + Number(m.monto ?? 0), 0),
    }));

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    return res.status(500).json({ error: 'Error al obtener pagos' });
  }
};

// GET /api/pagos-proveedores/formas-pago
export const getFormasPago = async (req, res) => {
  try {
    const formas = await prisma.forma_pago.findMany({
      orderBy: { metodo_pago: 'asc' }
    });
    return res.json(formas.map((f) => ({
      id: f.id_forma_pago,
      nombre: f.metodo_pago,
      tipo: f.tipo_metodo,
    })));
  } catch (error) {
    console.error('Error al obtener formas de pago:', error);
    return res.status(500).json({ error: 'Error al obtener formas de pago' });
  }
};

// POST /api/pagos-proveedores
export const registrarPago = async (req, res) => {
  const { proveedorId, facturaIds, medios, fecha } = req.body;

  if (!proveedorId) return res.status(400).json({ error: 'El proveedor es requerido' });
  if (!facturaIds?.length) return res.status(400).json({ error: 'Seleccioná al menos una factura' });
  if (!medios?.length) return res.status(400).json({ error: 'Agregá al menos un medio de pago' });

  const mediosValidos = medios.filter((m) => Number(m.monto) > 0);
  if (!mediosValidos.length) return res.status(400).json({ error: 'El monto del medio de pago debe ser mayor a 0' });

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear orden de pago
      const ordenPago = await tx.orden_pago_proveedores.create({
        data: {
          id_proveedor: Number(proveedorId),
          fecha_pago: fecha ? new Date(fecha) : new Date(),
        }
      });

      // 2. Registrar medios de pago
      for (const medio of mediosValidos) {
        // Buscar o crear la forma de pago
        let formaPago = await tx.forma_pago.findFirst({
          where: { metodo_pago: medio.medio }
        });
        if (!formaPago) {
          formaPago = await tx.forma_pago.create({
            data: { metodo_pago: medio.medio, tipo_metodo: 'efectivo' }
          });
        }

        await tx.orden_pago_forma_pago.create({
          data: {
            id_orden_pago: ordenPago.id_orden_pago,
            id_forma_pago: formaPago.id_forma_pago,
            monto: Number(medio.monto),
          }
        });

        // --- INTEGRACIÓN CON TESORERÍA ---
        // Si el medio parece ser bancario, intentamos registrar el movimiento en el banco
        try {
          const bancoMatch = await tx.banco.findFirst({
            where: {
              OR: [
                { nombre: { contains: medio.medio, mode: 'insensitive' } },
                { nombre: { equals: medio.medio.split(' ')[0], mode: 'insensitive' } }
              ]
            },
            include: { cuenta_bancaria: true }
          });

          if (bancoMatch && bancoMatch.cuenta_bancaria.length > 0) {
            const cuenta = bancoMatch.cuenta_bancaria[0];
            await tx.movimiento_bancario.create({
              data: {
                id_cuenta: cuenta.id_cuenta,
                monto_egreso: Number(medio.monto),
                fecha_movimiento: fecha ? new Date(fecha) : new Date(),
                tipo_movimiento: 'Débito',
                concepto: `Pago a Proveedor (OP-${String(ordenPago.id_orden_pago).padStart(4, '0')})`,
                tipo_deposito: medio.medio.toLowerCase().includes('cheque') ? 'Cheque Propio' : 'Transferencia',
                // Si es transferencia, se confirma de inmediato usualmente
                fecha_confirmacion: medio.medio.toLowerCase().includes('transferencia') ? new Date() : null
              }
            });
          }
        } catch (tesoreriaErr) {
          console.error('Error al integrar con Tesorería (no bloqueante):', tesoreriaErr);
          // No bloqueamos la transacción principal si falla la tesorería (soft fail)
        }
      }

      // 3. Registrar facturas incluidas en el pago
      for (const facturaId of facturaIds) {
        const factura = await tx.factura_compra.findUnique({
          where: { id_factura_compra: Number(facturaId) }
        });

        if (factura) {
          await tx.detalle_orden_pago_facturas.create({
            data: {
              id_orden_pago: ordenPago.id_orden_pago,
              id_factura_compra: Number(facturaId),
              monto_pagado_factura: Number(factura.total ?? 0),
            }
          });
        }
      }

      return ordenPago;
    });

    const total = mediosValidos.reduce((acc, m) => acc + Number(m.monto), 0);

    return res.status(201).json({
      ok: true,
      ordenPago: {
        id: resultado.id_orden_pago,
        numero: `OP-${String(resultado.id_orden_pago).padStart(4, '0')}`,
        proveedorId: Number(proveedorId),
        fecha: resultado.fecha_pago?.toISOString().split('T')[0],
        facturaIds,
        medios: mediosValidos,
        total,
        estado: 'Registrada',
      }
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    if (error?.code === 'P2020') {
      return res.status(400).json({
        error: 'Monto demasiado grande para la columna en la base de datos. Ejecutá npx prisma db push para aplicar el último schema.',
      });
    }
    return res.status(500).json({ error: 'Error al registrar pago' });
  }
};