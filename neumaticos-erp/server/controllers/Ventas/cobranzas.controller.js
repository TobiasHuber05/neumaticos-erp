import { prisma } from '../../lib/prisma.js';
import {
  esMedioBancario,
  datosMovimientoCobroCliente,
  estadoDetalleCobro,
} from '../../utils/tesoreriaIntegracion.utils.js';

const redondear = (n) => Math.round(Number(n) * 100) / 100;

const calcularSaldoFactura = (factura) => {
  const totalFactura = Number(factura.total ?? 0);
  const totalDevuelto = (factura.devolucion_cliente ?? []).reduce((acc, dev) => {
    const notas = dev.nota_credito_venta ?? [];
    const subNotas = notas.reduce(
      (s, nota) =>
        s +
        (nota.detalle_nota_credito ?? []).reduce((sn, d) => sn + Number(d.monto ?? 0), 0),
      0,
    );
    return acc + subNotas;
  }, 0);
  return redondear(totalFactura - totalDevuelto);
};

const totalCobradoFactura = (factura) =>
  (factura.cobranza ?? []).reduce((acc, c) => acc + Number(c.total ?? 0), 0);

// GET /api/cobranzas
export const getCobranzas = async (req, res) => {
  try {
    const cobranzas = await prisma.cobranza.findMany({
      include: {
        factura_venta: { include: { cliente: true } },
        detalle_cobranza: true,
      },
      orderBy: { id_cobranza: 'desc' },
    });

    return res.json(
      cobranzas.map((c) => ({
        id: c.id_cobranza,
        facturaId: c.id_factura_venta,
        nroRecibo: c.nro_recibo,
        fecha: c.fecha_cobro?.toISOString().split('T')[0] ?? '—',
        total: Number(c.total ?? 0),
        cliente: c.factura_venta?.cliente
          ? `${c.factura_venta.cliente.nombre ?? ''} ${c.factura_venta.cliente.apellido ?? ''}`.trim()
          : '—',
        facturaNumero: c.factura_venta?.nro_factura ?? '—',
        medios: (c.detalle_cobranza ?? []).map((d) => ({
          medio: d.forma_pago,
          monto: Number(d.monto ?? 0),
          estado: d.estado,
        })),
      })),
    );
  } catch (error) {
    console.error('Error al obtener cobranzas:', error);
    return res.status(500).json({ error: 'Error al obtener cobranzas' });
  }
};

// POST /api/cobranzas — registrar cobro de factura de venta
export const registrarCobro = async (req, res) => {
  const { facturaId, medios, fecha, nro_recibo } = req.body;

  if (!facturaId) return res.status(400).json({ error: 'La factura es requerida' });
  if (!medios?.length) return res.status(400).json({ error: 'Agregá al menos un medio de cobro' });

  const mediosValidos = medios
    .map((m) => ({
      medio: m.medio,
      monto: redondear(m.monto),
      id_cuenta: m.id_cuenta ? Number(m.id_cuenta) : null,
    }))
    .filter((m) => m.monto > 0);

  if (!mediosValidos.length) {
    return res.status(400).json({ error: 'El monto del medio de cobro debe ser mayor a 0' });
  }

  for (const m of mediosValidos) {
    if (esMedioBancario(m.medio) && !m.id_cuenta) {
      return res.status(400).json({
        error: `Seleccioná la cuenta bancaria para el cobro con ${m.medio}`,
      });
    }
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const factura = await tx.factura_venta.findUnique({
        where: { id_factura_venta: Number(facturaId) },
        include: {
          devolucion_cliente: {
            include: {
              nota_credito_venta: { include: { detalle_nota_credito: true } },
            },
          },
          cobranza: true,
        },
      });

      if (!factura) throw new Error('Factura no encontrada');

      const saldoPendiente = calcularSaldoFactura(factura);
      const yaCobrado = totalCobradoFactura(factura);

      if (saldoPendiente <= 0) {
        throw new Error('La factura no tiene saldo pendiente de cobro');
      }
      if (yaCobrado >= saldoPendiente - 0.009) {
        throw new Error('La factura ya fue cobrada');
      }

      const totalMedios = redondear(mediosValidos.reduce((acc, m) => acc + m.monto, 0));
      const saldoACobrar = redondear(saldoPendiente - yaCobrado);

      if (Math.abs(totalMedios - saldoACobrar) > 0.009) {
        throw new Error(
          `El total de medios (Gs. ${totalMedios.toLocaleString('de-DE')}) debe coincidir con el saldo a cobrar (Gs. ${saldoACobrar.toLocaleString('de-DE')})`,
        );
      }

      const fechaCobro = fecha ? new Date(fecha) : new Date();
      const nroRecibo =
        nro_recibo?.trim() ||
        `REC-${String(factura.id_factura_venta).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;

      const cobranza = await tx.cobranza.create({
        data: {
          id_factura_venta: factura.id_factura_venta,
          nro_recibo: nroRecibo,
          fecha_cobro: fechaCobro,
          total: totalMedios,
        },
      });

      let primerMovimientoId = null;

      for (const medio of mediosValidos) {
        await tx.detalle_cobranza.create({
          data: {
            id_cobranza: cobranza.id_cobranza,
            forma_pago: medio.medio,
            monto: medio.monto,
            estado: estadoDetalleCobro(medio.medio),
          },
        });

        const requiereCuenta =
          esMedioBancario(medio.medio) || medio.medio === 'Efectivo';

        if (!requiereCuenta || !medio.id_cuenta) continue;

        const cuenta = await tx.cuenta_bancaria.findUnique({
          where: { id_cuenta: medio.id_cuenta },
        });
        if (!cuenta) {
          throw new Error(`La cuenta bancaria ${medio.id_cuenta} no existe`);
        }

        const referencia = `Cobro Cliente (${nroRecibo}) — Factura ${factura.nro_factura ?? factura.id_factura_venta}`;
        const datosMov = datosMovimientoCobroCliente(
          medio.medio,
          medio.monto,
          fechaCobro,
          referencia,
        );

        const movimiento = await tx.movimiento_bancario.create({
          data: {
            id_cuenta: cuenta.id_cuenta,
            ...datosMov,
            fecha_movimiento: fechaCobro,
          },
        });

        if (!primerMovimientoId) primerMovimientoId = movimiento.id_movimiento;
      }

      if (primerMovimientoId) {
        await tx.cobranza.update({
          where: { id_cobranza: cobranza.id_cobranza },
          data: { id_movimiento_bancario: primerMovimientoId },
        });
      }

      try {
        const { ejecutarAsientoCobroCliente } = await import('./asientos.controller.js');
        const primerIdCuenta = mediosValidos.find(m => m.id_cuenta)?.id_cuenta || null;
        await ejecutarAsientoCobroCliente(
          tx,
          { ...cobranza, total: totalMedios, fecha_cobro: fechaCobro },
          factura,
          primerIdCuenta,
        );
      } catch (errorAsiento) {
        console.error('⚠️ El asiento de cobro falló, pero se guarda el cobro:', errorAsiento);
      }

      return { cobranza, totalMedios, nroRecibo, saldoPendiente: saldoACobrar };
    });

    const { cobranza, totalMedios, nroRecibo, saldoPendiente } = resultado;

    return res.status(201).json({
      ok: true,
      cobranza: {
        id: cobranza.id_cobranza,
        facturaId: Number(facturaId),
        nroRecibo,
        fecha: cobranza.fecha_cobro?.toISOString().split('T')[0],
        total: totalMedios,
        medios: mediosValidos,
        saldoCobrado: saldoPendiente,
      },
    });
  } catch (error) {
    console.error('Error al registrar cobro:', error);
    if (error?.message && !error?.code) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al registrar cobro' });
  }
};
