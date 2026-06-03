import { prisma } from '../../lib/prisma.js';

const OPERACIONES = [
  { id: 'VENTA_FACTURA', descripcion: 'Factura de Venta' },
  { id: 'VENTA_NOTA_CREDITO', descripcion: 'Nota de Crédito - Venta' },
  { id: 'COMPRA_FACTURA', descripcion: 'Factura de Compra' },
  { id: 'COMPRA_NOTA_CREDITO', descripcion: 'Nota de Crédito - Compra' },
  { id: 'COBRO_CLIENTE', descripcion: 'Cobro a Cliente' },
  { id: 'PAGO_PROVEEDOR', descripcion: 'Pago a Proveedor' },
  { id: 'TESORERIA_DEPOSITO', descripcion: 'Depósito Bancario' },
  { id: 'TESORERIA_INTERESES', descripcion: 'Intereses Bancarios' },
  { id: 'TESORERIA_GASTO', descripcion: 'Gasto Bancario' },
  { id: 'TESORERIA_CHEQUE_RECHAZADO', descripcion: 'Cheque Rechazado' },
  { id: 'NOMINA_SUELDOS', descripcion: 'Nómina - Pago de Salarios' },
];

export const getOperaciones = async (req, res) => {
  res.json(OPERACIONES);
};

export const listar = async (req, res) => {
  try {
    const modelos = await prisma.modelo_asiento.findMany({
      include: {
        detalle_modelo_asiento: {
          orderBy: { item: 'asc' },
          include: { plan_cuentas: true },
        },
      },
      orderBy: { descripcion: 'asc' },
    });
    res.json(modelos);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar modelos de asiento' });
  }
};

export const obtener = async (req, res) => {
  try {
    const modelo = await prisma.modelo_asiento.findUnique({
      where: { id_modelo_asiento: Number(req.params.id) },
      include: {
        detalle_modelo_asiento: {
          orderBy: { item: 'asc' },
          include: { plan_cuentas: true },
        },
      },
    });
    if (!modelo) return res.status(404).json({ error: 'Modelo no encontrado' });
    res.json(modelo);
  } catch (error) {
    console.error('Error al listar modelos:', error);
    res.status(500).json({ error: 'Error al listar modelos de asiento' });
  }
};

export const crear = async (req, res) => {
  const { operacion_asiento, descripcion, tipo_asiento, lineas } = req.body;

  if (!operacion_asiento || !descripcion) {
    return res.status(400).json({ error: 'operacion_asiento y descripcion son requeridos' });
  }

  try {
    const existente = await prisma.modelo_asiento.findFirst({
      where: { operacion_asiento },
    });
    if (existente) {
      return res.status(400).json({ error: `Ya existe un modelo para la operación: ${operacion_asiento}` });
    }

    const modelo = await prisma.modelo_asiento.create({
      data: {
        operacion_asiento,
        descripcion,
        tipo_asiento: tipo_asiento || 'Automatico',
        detalle_modelo_asiento: {
          create: (lineas || []).map((l, i) => ({
            item: i + 1,
            descripcion_final: l.descripcion_final,
            id_cuenta: l.id_cuenta ? Number(l.id_cuenta) : null,
            debe_haber: l.debe_haber,
            iva: l.iva || false,
            es_cuenta_bancaria: l.es_cuenta_bancaria || false,
          })),
        },
      },
      include: {
        detalle_modelo_asiento: {
          orderBy: { item: 'asc' },
          include: { plan_cuentas: true },
        },
      },
    });

    res.status(201).json(modelo);
  } catch (error) {
    console.error('Error al crear modelo:', error);
    res.status(500).json({ error: 'Error al crear modelo de asiento' });
  }
};

export const actualizar = async (req, res) => {
  const { id } = req.params;
  const { descripcion, tipo_asiento, lineas } = req.body;

  try {
    const modelo = await prisma.modelo_asiento.findUnique({
      where: { id_modelo_asiento: Number(id) },
    });
    if (!modelo) return res.status(404).json({ error: 'Modelo no encontrado' });

    await prisma.$transaction(async (tx) => {
      await tx.modelo_asiento.update({
        where: { id_modelo_asiento: Number(id) },
        data: {
          descripcion,
          tipo_asiento: tipo_asiento || modelo.tipo_asiento,
        },
      });

      await tx.detalle_modelo_asiento.deleteMany({
        where: { id_modelo_asiento: Number(id) },
      });

      if (lineas && lineas.length > 0) {
        await tx.detalle_modelo_asiento.createMany({
          data: lineas.map((l, i) => ({
            id_modelo_asiento: Number(id),
            item: i + 1,
            descripcion_final: l.descripcion_final,
            id_cuenta: l.id_cuenta ? Number(l.id_cuenta) : null,
            debe_haber: l.debe_haber,
            iva: l.iva || false,
            es_cuenta_bancaria: l.es_cuenta_bancaria || false,
          })),
        });
      }
    });

    const actualizado = await prisma.modelo_asiento.findUnique({
      where: { id_modelo_asiento: Number(id) },
      include: {
        detalle_modelo_asiento: {
          orderBy: { item: 'asc' },
          include: { plan_cuentas: true },
        },
      },
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar modelo de asiento' });
  }
};

export const eliminar = async (req, res) => {
  const { id } = req.params;
  const idNum = Number(id);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.detalle_modelo_asiento.deleteMany({
        where: { id_modelo_asiento: idNum },
      });
      await tx.modelo_asiento.delete({
        where: { id_modelo_asiento: idNum },
      });
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar modelo de asiento' });
  }
};
