import { prisma } from '../../lib/prisma.js';

// GET /api/conciliaciones
export const getConciliaciones = async (req, res) => {
    try {
        const conciliaciones = await prisma.conciliacion_bancaria.findMany({
            include: {
                cuenta_bancaria: { include: { banco: true } },
                _count: { select: { detalle_conciliacion: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        const data = conciliaciones.map(c => ({
            id_conciliacion: c.id_conciliacion,
            id_cuenta: c.id_cuenta,
            banco: c.cuenta_bancaria?.banco?.nombre || 'N/A',
            numero_cuenta: c.cuenta_bancaria?.numero_cuenta || 'N/A',
            fecha: c.fecha?.toISOString().split('T')[0],
            descripcion: c.descripcion,
            saldo_banco: Number(c.saldo_banco ?? 0),
            monto_erp: Number(c.monto_erp ?? 0),
            diferencia: Number(c.diferencia ?? 0),
            estado: c.estado,
            items: c._count.detalle_conciliacion
        }));

        return res.json(data);
    } catch (error) {
        console.error('Error al obtener conciliaciones:', error);
        return res.status(500).json({ error: 'Error al obtener conciliaciones' });
    }
};

// GET /api/conciliaciones/:id
export const getConciliacionById = async (req, res) => {
    const { id } = req.params;
    try {
        const c = await prisma.conciliacion_bancaria.findUnique({
            where: { id_conciliacion: Number(id) },
            include: {
                cuenta_bancaria: { include: { banco: true } },
                detalle_conciliacion: {
                    include: { movimiento_bancario: true }
                }
            }
        });

        if (!c) return res.status(404).json({ error: 'Conciliación no encontrada' });

        return res.json(c);
    } catch (error) {
        console.error('Error al obtener detalle de conciliación:', error);
        return res.status(500).json({ error: 'Error al obtener detalle' });
    }
};

// POST /api/conciliaciones
export const crearConciliacion = async (req, res) => {
    const { id_cuenta, fecha, descripcion, saldo_banco } = req.body;

    if (!id_cuenta || !fecha) {
        return res.status(400).json({ error: 'Cuenta y fecha son requeridas' });
    }

    try {
        const conciliacion = await prisma.conciliacion_bancaria.create({
            data: {
                id_cuenta: Number(id_cuenta),
                fecha: new Date(fecha),
                descripcion,
                saldo_banco: Number(saldo_banco ?? 0),
                monto_erp: 0,
                diferencia: Number(saldo_banco ?? 0),
                estado: 'Pendiente'
            }
        });

        return res.status(201).json(conciliacion);
    } catch (error) {
        console.error('Error al crear conciliación:', error);
        return res.status(500).json({ error: 'Error al crear conciliación' });
    }
};

// POST /api/conciliaciones/:id/vincular
export const vincularMovimientos = async (req, res) => {
    const { id } = req.params;
    const { movimientoIds } = req.body; // Array de IDs de movimientos

    try {
        // Primero eliminamos vínculos previos si los hubiera para este proceso (opcional)
        // await prisma.detalle_conciliacion.deleteMany({ where: { id_conciliacion: Number(id) } });

        const operations = movimientoIds.map(movId =>
            prisma.detalle_conciliacion.create({
                data: {
                    id_conciliacion: Number(id),
                    id_movimiento: Number(movId),
                    conciliado: true
                }
            })
        );

        await prisma.$transaction(operations);

        // Recalcular montos en la cabecera
        await recalcularTotales(Number(id));

        return res.json({ ok: true });
    } catch (error) {
        console.error('Error al vincular movimientos:', error);
        return res.status(500).json({ error: 'Error al vincular movimientos' });
    }
};

// PATCH /api/conciliaciones/:id/finalizar
export const finalizarConciliacion = async (req, res) => {
    const { id } = req.params;

    try {
        const detalles = await prisma.detalle_conciliacion.findMany({
            where: { id_conciliacion: Number(id), conciliado: true },
            select: { id_movimiento: true }
        });

        const movIds = detalles.map(d => d.id_movimiento);

        await prisma.$transaction([
            // 1. Marcar movimientos como confirmados en la tabla principal
            prisma.movimiento_bancario.updateMany({
                where: { id_movimiento: { in: movIds } },
                data: { fecha_confirmacion: new Date() }
            }),
            // 2. Cerrar la conciliación
            prisma.conciliacion_bancaria.update({
                where: { id_conciliacion: Number(id) },
                data: { estado: 'Cerrada' }
            })
        ]);

        return res.json({ ok: true, mensaje: 'Conciliación cerrada y movimientos confirmados' });
    } catch (error) {
        console.error('Error al finalizar conciliación:', error);
        return res.status(500).json({ error: 'Error al finalizar conciliación' });
    }
};

// Helper para recalcular totales
async function recalcularTotales(id_conciliacion) {
    const detalles = await prisma.detalle_conciliacion.findMany({
        where: { id_conciliacion, conciliado: true },
        include: { movimiento_bancario: true }
    });

    let montoErp = 0;
    detalles.forEach(d => {
        const ingreso = Number(d.movimiento_bancario.monto_ingreso ?? 0);
        const egreso = Number(d.movimiento_bancario.monto_egreso ?? 0);
        montoErp += (ingreso - egreso);
    });

    const cabecera = await prisma.conciliacion_bancaria.findUnique({
        where: { id_conciliacion }
    });

    const saldoBanco = Number(cabecera.saldo_banco ?? 0);
    const diferencia = saldoBanco - montoErp;

    await prisma.conciliacion_bancaria.update({
        where: { id_conciliacion },
        data: {
            monto_erp: montoErp,
            diferencia: diferencia
        }
    });
}
