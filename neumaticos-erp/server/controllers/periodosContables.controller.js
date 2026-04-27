import { prisma } from '../lib/prisma.js';

// GET /api/periodos-contables
export const getPeriodosContables = async (req, res) => {
    try {
        const periodos = await prisma.proceso_contable.findMany({
            orderBy: { periodo_anho: 'desc' }
        });
        res.json(periodos.map(p => ({
            id: p.id_proc_contable,
            id_proc_contable: p.id_proc_contable,
            periodo_anho: p.periodo_anho,
            descripcion: p.descripcion,
            fecha_inicio: p.fecha_inicio,
            fecha_fin: p.fecha_fin,
            estado: p.estado,
            moneda: p.moneda
        })));
    } catch (error) {
        console.error('Error al obtener periodos contables:', error);
        res.status(500).json({ error: 'Error al obtener periodos contables' });
    }
};

// POST /api/periodos-contables
export const createPeriodoContable = async (req, res) => {
    const { periodo_anho, descripcion, fecha_inicio, fecha_fin, moneda } = req.body;
    try {
        const nuevo = await prisma.proceso_contable.create({
            data: {
                periodo_anho,
                descripcion,
                fecha_inicio: new Date(fecha_inicio),
                fecha_fin: new Date(fecha_fin),
                estado: 'Abierto',
                moneda: moneda || 'Gs'
            }
        });
        res.status(201).json(nuevo);
    } catch (error) {
        console.error('Error al crear periodo contable:', error);
        res.status(500).json({ error: 'Error al crear periodo contable' });
    }
};

// PUT /api/periodos-contables/:id/cerrar
export const cerrarPeriodoContable = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.proceso_contable.update({
            where: { id_proc_contable: Number(id) },
            data: { estado: 'Cerrado' }
        });
        res.json({ message: 'Periodo cerrado correctamente' });
    } catch (error) {
        console.error('Error al cerrar periodo contable:', error);
        res.status(500).json({ error: 'Error al cerrar periodo contable' });
    }
};
