import { prisma } from '../../lib/prisma.js';
import {
  esMedioBancario,
  datosMovimientoPagoProveedor,
} from '../../utils/tesoreriaIntegracion.utils.js';

const redondear = (n) => Math.round(Number(n) * 100) / 100;
const MEDIO_NOTA_CREDITO = 'Nota de crédito';

const esNotaCredito = (medio) =>
  String(medio ?? '').trim().toLowerCase() === MEDIO_NOTA_CREDITO.toLowerCase();

async function calcularCreditoDisponibleProveedor(tx, proveedorId) {
  const notas = await tx.nota_credito.findMany({
    where: {
      pedido_devolucion: {
        is: {
          factura_compra: { is: { id_proveedor: Number(proveedorId) } },
        },
      },
    },
  });

  const totalNotas = notas.reduce((acc, nc) => acc + Number(nc.monto_subtotal ?? 0), 0);

  const pagosConNota = await tx.orden_pago_forma_pago.findMany({
    where: {
      forma_pago: { metodo_pago: MEDIO_NOTA_CREDITO },
      orden_pago_proveedores: { is: { id_proveedor: Number(proveedorId) } },
    },
  });

  const totalUsado = pagosConNota.reduce((acc, pago) => acc + Number(pago.monto ?? 0), 0);
  return redondear(totalNotas - totalUsado);
}

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
      facturas: op.detalle_orden_pago_facturas.map((d) => ({
        facturaId: d.id_factura_compra,
        monto: Number(d.monto_pagado_factura ?? 0),
      })),
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
    const data = formas.map((f) => ({
      id: f.id_forma_pago,
      nombre: f.metodo_pago,
      tipo: f.tipo_metodo,
    }));

    if (!data.some((f) => esNotaCredito(f.nombre))) {
      data.push({ id: null, nombre: MEDIO_NOTA_CREDITO, tipo: 'nota_credito' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener formas de pago:', error);
    return res.status(500).json({ error: 'Error al obtener formas de pago' });
  }
};

// POST /api/pagos-proveedores — soporta pagos parciales por factura
export const registrarPago = async (req, res) => {
  const { proveedorId, facturaIds, facturas: facturasBody, medios, fecha } = req.body;

  if (!proveedorId) return res.status(400).json({ error: 'El proveedor es requerido' });
  if (!medios?.length) return res.status(400).json({ error: 'Agregá al menos un medio de pago' });

  const mediosValidos = medios
    .map((m) => ({
      medio: m.medio,
      monto: redondear(m.monto),
      id_cuenta: m.id_cuenta ? Number(m.id_cuenta) : null
    }))
    .filter((m) => m.monto > 0);

  if (!mediosValidos.length) {
    return res.status(400).json({ error: 'El monto del medio de pago debe ser mayor a 0' });
  }

  for (const m of mediosValidos) {
    if (esMedioBancario(m.medio) && !m.id_cuenta) {
      return res.status(400).json({
        error: `Seleccioná la cuenta bancaria para el pago con ${m.medio}`,
      });
    }
  }

  let lineasFactura = [];
  if (Array.isArray(facturasBody) && facturasBody.length) {
    lineasFactura = facturasBody.map((f) => ({
      id: Number(f.id ?? f.facturaId),
      monto: f.monto != null ? redondear(f.monto) : null,
    }));
  } else if (facturaIds?.length) {
    lineasFactura = facturaIds.map((id) => ({ id: Number(id), monto: null }));
  } else {
    return res.status(400).json({ error: 'Seleccioná al menos una factura' });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const montosPorFactura = [];

      for (const linea of lineasFactura) {
        const factura = await tx.factura_compra.findUnique({
          where: { id_factura_compra: linea.id },
          include: { detalle_orden_pago_facturas: true },
        });

        if (!factura) {
          throw new Error(`Factura ${linea.id} no encontrada`);
        }
        if (Number(factura.id_proveedor) !== Number(proveedorId)) {
          throw new Error(`La factura ${linea.id} no pertenece al proveedor seleccionado`);
        }

        const totalFactura = Number(factura.total ?? 0);
        const yaPagado = (factura.detalle_orden_pago_facturas ?? []).reduce(
          (acc, d) => acc + Number(d.monto_pagado_factura ?? 0),
          0
        );
        const saldo = redondear(totalFactura - yaPagado);

        if (saldo <= 0) {
          throw new Error(`La factura ${linea.id} ya está pagada`);
        }

        const montoAplicar = linea.monto != null ? redondear(linea.monto) : saldo;

        if (montoAplicar <= 0) {
          throw new Error(`El monto a pagar de la factura ${linea.id} debe ser mayor a 0`);
        }
        if (montoAplicar > saldo + 0.009) {
          throw new Error(
            `El monto a pagar (Gs. ${montoAplicar.toLocaleString('de-DE')}) supera el saldo pendiente (Gs. ${saldo.toLocaleString('de-DE')})`
          );
        }

        montosPorFactura.push({ id: linea.id, monto: montoAplicar, saldoOriginal: saldo });
      }

      const totalMedios = redondear(mediosValidos.reduce((acc, m) => acc + m.monto, 0));
      const totalFacturas = redondear(montosPorFactura.reduce((acc, f) => acc + f.monto, 0));

      if (Math.abs(totalMedios - totalFacturas) > 0.009) {
        throw new Error(
          `El total de medios de pago (Gs. ${totalMedios.toLocaleString('de-DE')}) debe coincidir con el total aplicado a facturas (Gs. ${totalFacturas.toLocaleString('de-DE')})`
        );
      }

      const totalNotaCredito = redondear(
        mediosValidos
          .filter((m) => esNotaCredito(m.medio))
          .reduce((acc, m) => acc + m.monto, 0),
      );

      if (totalNotaCredito > 0) {
        const creditoDisponible = await calcularCreditoDisponibleProveedor(tx, proveedorId);
        if (totalNotaCredito > creditoDisponible + 0.009) {
          throw new Error(
            `El monto aplicado con nota de crédito (Gs. ${totalNotaCredito.toLocaleString('de-DE')}) supera el crédito disponible del proveedor (Gs. ${creditoDisponible.toLocaleString('de-DE')})`,
          );
        }
      }

      const ordenPago = await tx.orden_pago_proveedores.create({
        data: {
          id_proveedor: Number(proveedorId),
          fecha_pago: fecha ? new Date(fecha) : new Date(),
        },
      });

      for (const medio of mediosValidos) {
        let formaPago = await tx.forma_pago.findFirst({
          where: { metodo_pago: medio.medio },
        });
        if (!formaPago) {
          formaPago = await tx.forma_pago.create({
            data: { metodo_pago: medio.medio, tipo_metodo: esNotaCredito(medio.medio) ? 'nota_credito' : 'efectivo' },
          });
        }

        await tx.orden_pago_forma_pago.create({
          data: {
            id_orden_pago: ordenPago.id_orden_pago,
            id_forma_pago: formaPago.id_forma_pago,
            monto: medio.monto,
          },
        });

        try {
          if (!esMedioBancario(medio.medio)) continue;

          let cuenta = null;
          if (medio.id_cuenta) {
            cuenta = await tx.cuenta_bancaria.findUnique({
              where: { id_cuenta: medio.id_cuenta },
            });
            if (!cuenta) {
              throw new Error(`La cuenta bancaria ${medio.id_cuenta} no existe`);
            }
          } else {
            const bancoMatch = await tx.banco.findFirst({
              where: {
                OR: [
                  { nombre: { contains: medio.medio, mode: 'insensitive' } },
                  { nombre: { equals: medio.medio.split(' ')[0], mode: 'insensitive' } },
                ],
              },
              include: { cuenta_bancaria: true },
            });
            if (bancoMatch?.cuenta_bancaria?.length > 0) {
              cuenta = bancoMatch.cuenta_bancaria[0];
            }
          }

          if (cuenta) {
            const referencia = `Pago a Proveedor (OP-${String(ordenPago.id_orden_pago).padStart(4, '0')})`;
            const datosMov = datosMovimientoPagoProveedor(
              medio.medio,
              medio.monto,
              fecha,
              referencia,
            );
            await tx.movimiento_bancario.create({
              data: {
                id_cuenta: cuenta.id_cuenta,
                ...datosMov,
                fecha_movimiento: fecha ? new Date(fecha) : new Date(),
              },
            });
          }
        } catch (tesoreriaErr) {
          console.error('Error al integrar con Tesorería (no bloqueante):', tesoreriaErr);
        }
      }

      for (const { id, monto } of montosPorFactura) {
        await tx.detalle_orden_pago_facturas.create({
          data: {
            id_orden_pago: ordenPago.id_orden_pago,
            id_factura_compra: id,
            monto_pagado_factura: monto,
          },
        });
      }

      const esParcial = montosPorFactura.some((f) => f.monto < f.saldoOriginal);
      const { ejecutarAsientoPagoProveedor } = await import('../Contabilidad/asientos.controller.js');
      const primerIdCuenta = mediosValidos.find(m => m.id_cuenta)?.id_cuenta || null;
      await ejecutarAsientoPagoProveedor(tx, { ...ordenPago, total: totalMedios }, esParcial, primerIdCuenta);

      return { ordenPago, montosPorFactura, totalMedios };
    });

    const { ordenPago, montosPorFactura, totalMedios } = resultado;

    return res.status(201).json({
      ok: true,
      ordenPago: {
        id: ordenPago.id_orden_pago,
        numero: `OP-${String(ordenPago.id_orden_pago).padStart(4, '0')}`,
        proveedorId: Number(proveedorId),
        fecha: ordenPago.fecha_pago?.toISOString().split('T')[0],
        facturaIds: montosPorFactura.map((f) => f.id),
        facturas: montosPorFactura,
        medios: mediosValidos,
        total: totalMedios,
        estado: 'Registrada',
      },
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    if (error?.message && !error?.code) {
      return res.status(400).json({ error: error.message });
    }
    if (error?.code === 'P2020') {
      return res.status(400).json({
        error: 'Monto demasiado grande para la columna en la base de datos. Ejecutá npx prisma db push para aplicar el último schema.',
      });
    }
    return res.status(500).json({ error: 'Error al registrar pago' });
  }
};
