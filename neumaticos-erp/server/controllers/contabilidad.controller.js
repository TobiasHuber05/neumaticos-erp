import { prisma } from '../lib/prisma.js';

// --- PERIODOS CONTABLES ---

export const getPeriodos = async (req, res) => {
  try {
    const periodos = await prisma.proceso_contable.findMany({
      orderBy: { periodo_anho: 'desc' }
    });
    res.json(periodos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener periodos' });
  }
};

export const createPeriodo = async (req, res) => {
  const { periodo_anho, descripcion, fecha_inicio, fecha_fin, moneda } = req.body;
  try {
    const nuevo = await prisma.proceso_contable.create({
      data: {
        periodo_anho,
        descripcion,
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        moneda,
        estado: 'Abierto'
      }
    });
    res.json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear periodo' });
  }
};

export const closePeriodo = async (req, res) => {
  const { id } = req.params;
  try {
    const actualizado = await prisma.proceso_contable.update({
      where: { id_proc_contable: parseInt(id) },
      data: { estado: 'Cerrado' }
    });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar periodo' });
  }
};

// --- PLAN DE CUENTAS ---

export const getPlanCuentas = async (req, res) => {
  const { id_periodo } = req.query;
  try {
    const plan = await prisma.plan_cuentas.findMany({
      where: id_periodo ? { id_proc_contable: parseInt(id_periodo) } : {},
      orderBy: { cuenta_contable: 'asc' }
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener plan de cuentas' });
  }
};

export const createCuenta = async (req, res) => {
  const { id_proc_contable, cuenta_contable, nombre, asentable, cuenta_padre, tipo_cuenta, nivel } = req.body;
  try {
    // Validar si el periodo está abierto
    const periodo = await prisma.proceso_contable.findUnique({
      where: { id_proc_contable: parseInt(id_proc_contable) }
    });
    if (periodo.estado !== 'Abierto') {
      return res.status(400).json({ error: 'No se pueden crear cuentas en un periodo cerrado' });
    }

    const nueva = await prisma.plan_cuentas.create({
      data: {
        id_proc_contable: parseInt(id_proc_contable),
        cuenta_contable,
        nombre,
        asentable,
        cuenta_padre: cuenta_padre ? parseInt(cuenta_padre) : null,
        tipo_cuenta,
        nivel: parseInt(nivel)
      }
    });
    res.json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cuenta' });
  }
};

// --- ASIENTOS ---

export const getAsientos = async (req, res) => {
  const { id_periodo } = req.query;
  try {
    const asientos = await prisma.asientos.findMany({
      where: id_periodo ? { id_proc_contable: parseInt(id_periodo) } : {},
      include: {
        asiento_detalle: {
          include: { plan_cuentas: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });
    res.json(asientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener asientos' });
  }
};

export const createAsientoManual = async (req, res) => {
  const { id_proc_contable, fecha, descripcion, detalles } = req.body;
  // detalles: [{ id_cuenta, monto, debe_haber }]
  
  try {
    // Validar partida doble
    const debe = detalles.filter(d => d.debe_haber).reduce((acc, d) => acc + Number(d.monto), 0);
    const haber = detalles.filter(d => !d.debe_haber).reduce((acc, d) => acc + Number(d.monto), 0);
    
    if (Math.abs(debe - haber) > 0.01) {
      return res.status(400).json({ error: 'La suma del debe debe ser igual a la suma del haber' });
    }

    const asiento = await prisma.asientos.create({
      data: {
        id_proc_contable: parseInt(id_proc_contable),
        fecha: new Date(fecha),
        descripcion,
        total_debe: debe,
        total_haber: haber,
        estado: 'confirmado',
        asiento_detalle: {
          create: detalles.map(d => ({
            id_cuenta: parseInt(d.id_cuenta),
            monto: d.monto,
            debe_haber: d.debe_haber
          }))
        }
      }
    });
    res.json(asiento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear asiento manual' });
  }
};

// --- REPORTES ---

export const getLibroDiario = async (req, res) => {
  const { id_periodo, start, end } = req.query;
  try {
    const where = { id_proc_contable: parseInt(id_periodo) };
    if (start && end) {
      where.fecha = { gte: new Date(start), lte: new Date(end) };
    }
    
    const asientos = await prisma.asientos.findMany({
      where,
      include: {
        asiento_detalle: {
          include: { plan_cuentas: true }
        }
      },
      orderBy: { fecha: 'asc' }
    });
    res.json(asientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar Libro Diario' });
  }
};

export const getLibroMayor = async (req, res) => {
  const { id_periodo, id_cuenta } = req.query;
  try {
    const detalles = await prisma.asiento_detalle.findMany({
      where: {
        id_cuenta: parseInt(id_cuenta),
        asientos: { id_proc_contable: parseInt(id_periodo) }
      },
      include: { asientos: true },
      orderBy: { asientos: { fecha: 'asc' } }
    });
    res.json(detalles);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar Libro Mayor' });
  }
};

export const getBalanceSumasSaldos = async (req, res) => {
  const { id_periodo } = req.query;
  try {
    const cuentas = await prisma.plan_cuentas.findMany({
      where: { id_proc_contable: parseInt(id_periodo), asentable: true },
      include: {
        asiento_detalle: {
          where: { asientos: { id_proc_contable: parseInt(id_periodo) } }
        }
      }
    });

    const balance = cuentas.map(c => {
      const debe = c.asiento_detalle.filter(d => d.debe_haber).reduce((acc, d) => acc + Number(d.monto), 0);
      const haber = c.asiento_detalle.filter(d => !d.debe_haber).reduce((acc, d) => acc + Number(d.monto), 0);
      return {
        codigo: c.cuenta_contable,
        nombre: c.nombre,
        debe,
        haber,
        saldo_deudor: debe > haber ? debe - haber : 0,
        saldo_acreedor: haber > debe ? haber - debe : 0
      };
    });

    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar Balance de Sumas y Saldos' });
  }
};
