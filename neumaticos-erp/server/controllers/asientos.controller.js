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
