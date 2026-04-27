import { prisma } from '../lib/prisma.js';

const CUENTAS_COMPRA = [
  { code: 'SYS-COMPRA-MERC', nombre: 'Mercaderías (compras)' },
  { code: 'SYS-COMPRA-IVA', nombre: 'IVA crédito fiscal (compras)' },
  { code: 'SYS-COMPRA-PROV', nombre: 'Proveedores (compras)' },
];

async function idsPlanCuentasCompra(tx) {
  const ids = [];
  for (const { code, nombre } of CUENTAS_COMPRA) {
    let row = await tx.plan_cuentas.findFirst({ where: { cuenta_contable: code } });
    if (!row) {
      row = await tx.plan_cuentas.create({
        data: {
          cuenta_contable: code,
          nombre,
          asentable: true,
        },
      });
    }
    ids.push(row.id_cuenta);
  }
  return { mercaderia: ids[0], iva: ids[1], proveedores: ids[2] };
}

// GET: Obtener todos los asientos para la tabla del frontend
export const getAsientosCompras = async (req, res) => {
  try {
    const asientos = await prisma.asientos.findMany({
      where: { tabla_origen: 'factura_compra' },
      orderBy: { id_asiento: 'desc' }
    });
    res.json(asientos);
  } catch (error) {
    console.error("Error al obtener asientos:", error);
    res.status(500).json({ error: 'Error al obtener asientos' });
  }
};

export const ejecutarAsientoContableCompra = async (tx, factura) => {
  const { mercaderia, iva, proveedores } = await idsPlanCuentasCompra(tx);

  const total = Number(factura.total);
  const montoIva = Math.round(total / 11);
  const montoNeto = total - montoIva;

  return await tx.asientos.create({
    data: {
      fecha: new Date(),
      descripcion: `Asiento Compra - Fac. N° ${factura.id_factura_compra}`,
      total_debe: total,
      total_haber: total,
      tabla_origen: 'factura_compra',
      id_registro_origen: factura.id_factura_compra,
      estado: 'pendiente',
      asiento_detalle: {
        create: [
          { id_cuenta: mercaderia, monto: montoNeto, debe_haber: true },
          { id_cuenta: iva, monto: montoIva, debe_haber: true },
          { id_cuenta: proveedores, monto: total, debe_haber: false },
        ]
      }
    }
  });
};

// Cuentas para nómina
const CUENTAS_NOMINA = [
  { code: 'SYS-NOM-SUELDOS', nombre: 'Sueldos y Jornales' },
  { code: 'SYS-NOM-BONIF',   nombre: 'Bonificación Familiar' },
  { code: 'SYS-NOM-IPS',     nombre: 'Aportes y Retenciones a Pagar (IPS)' },
  { code: 'SYS-NOM-CAJA',    nombre: 'Caja y Banco (Pago Nómina)' },
];

async function idsPlanCuentasNomina(tx) {
  const ids = [];
  for (const { code, nombre } of CUENTAS_NOMINA) {
    let row = await tx.plan_cuentas.findFirst({ where: { cuenta_contable: code } });
    if (!row) {
      row = await tx.plan_cuentas.create({
        data: { cuenta_contable: code, nombre, asentable: true }
      });
    }
    ids.push(row.id_cuenta);
  }
  return { sueldos: ids[0], bonif: ids[1], ips: ids[2], caja: ids[3] };
}

// POST /api/asientos  — usado por el módulo de nómina al cerrar proceso
export const createAsiento = async (req, res) => {
  const { descripcion, fecha, tabla_origen, id_registro_origen, detalles } = req.body;
  // detalles: [{ cuenta_contable, nombre_cuenta, debe, haber }]

  if (!detalles || detalles.length === 0) {
    return res.status(400).json({ error: 'detalles es requerido' });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const totalDebe  = detalles.reduce((s, d) => s + Number(d.debe  ?? 0), 0);
      const totalHaber = detalles.reduce((s, d) => s + Number(d.haber ?? 0), 0);

      // Resolver o crear cada cuenta del plan
      const detallesConId = await Promise.all(
        detalles.map(async (d) => {
          let cuenta = await tx.plan_cuentas.findFirst({
            where: { cuenta_contable: d.cuenta_contable }
          });
          if (!cuenta) {
            cuenta = await tx.plan_cuentas.create({
              data: {
                cuenta_contable: d.cuenta_contable,
                nombre: d.nombre_cuenta,
                asentable: true,
              }
            });
          }
          return { id_cuenta: cuenta.id_cuenta, debe: Number(d.debe ?? 0), haber: Number(d.haber ?? 0) };
        })
      );

      const asiento = await tx.asientos.create({
        data: {
          fecha:              fecha ? new Date(fecha) : new Date(),
          descripcion,
          total_debe:         totalDebe,
          total_haber:        totalHaber,
          estado:             'confirmado',
          tabla_origen:       tabla_origen ?? 'nomina',
          id_registro_origen: id_registro_origen ?? null,
          asiento_detalle: {
            create: detallesConId.map(d => ({
              id_cuenta:  d.id_cuenta,
              monto:      d.debe > 0 ? d.debe : d.haber,
              debe_haber: d.debe > 0,   // true = Debe, false = Haber
            }))
          }
        },
        include: { asiento_detalle: true }
      });

      return asiento;
    });

    res.status(201).json({ ok: true, id_asiento: resultado.id_asiento });
  } catch (error) {
    console.error(' Error al crear asiento:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAsientosNomina = async (req, res) => {
  try {
    const asientos = await prisma.asientos.findMany({
      where: { tabla_origen: 'nomina' },
      orderBy: { id_asiento: 'desc' },
      include: {
        asiento_detalle: {
          include: { plan_cuentas: true }
        }
      }
    });
    res.json(asientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener asientos de nómina' });
  }
};
