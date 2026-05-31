import { prisma } from '../../lib/prisma.js';

function buildFechaWhere(fechaDesde, fechaHasta) {
    if (!fechaDesde && !fechaHasta) return undefined;
    const where = {};
    if (fechaDesde) where.gte = new Date(fechaDesde);
    if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.lte = hasta;
    }
    return where;
}

export const getMovimientos = async (req, res) => {
    const { fechaDesde, fechaHasta, productoId, tipoMovimiento } = req.query;

    try {
        const fechaWhere = buildFechaWhere(fechaDesde, fechaHasta);

        const where = {
            ...(fechaWhere && { fecha: fechaWhere }),
            ...(productoId && { id_producto: Number(productoId) }),
            ...(tipoMovimiento && { tipo_movimiento: tipoMovimiento }),
        };

        const movimientos = await prisma.movimiento_stock.findMany({
            where,
            include: {
                producto: {
                    select: {
                        descripcion: true,
                        codigo: true,
                    },
                },
            },
            orderBy: { fecha: 'desc' },
        });

        const data = movimientos.map((m) => ({
            id: m.id_movimiento_stock,
            fecha: m.fecha?.toISOString() ?? null,
            tipo: m.tipo_movimiento,
            cantidad: Number(m.cantidad ?? 0),
            stockResultante: Number(m.stock_resultante ?? 0),
            origen: m.origen,
            idOrigen: m.id_origen,
            descripcion: m.descripcion,
            productoId: m.id_producto,
            producto: m.producto?.descripcion ?? '—',
            codigoProducto: m.producto?.codigo ?? '—',
        }));

        return res.json(data);
    } catch (error) {
        console.error('Error en reporte de movimientos de stock:', error);
        return res.status(500).json({ error: 'Error al obtener movimientos de stock' });
    }
};

export const getKpis = async (req, res) => {
    const { fechaDesde, fechaHasta } = req.query;

    try {
        const fechaWhere = buildFechaWhere(fechaDesde, fechaHasta);

        const where = fechaWhere ? { fecha: fechaWhere } : {};

        const movimientos = await prisma.movimiento_stock.findMany({ where });

        const totalEntradas = movimientos
            .filter((m) => m.tipo_movimiento === 'Entrada')
            .reduce((acc, m) => acc + Number(m.cantidad ?? 0), 0);

        const totalSalidas = movimientos
            .filter((m) => m.tipo_movimiento === 'Salida')
            .reduce((acc, m) => acc + Number(m.cantidad ?? 0), 0);

        const productosAfectados = new Set(movimientos.map((m) => m.id_producto)).size;

        return res.json({
            totalMovimientos: movimientos.length,
            totalEntradas,
            totalSalidas,
            productosAfectados,
        });
    } catch (error) {
        console.error('Error en KPIs de stock:', error);
        return res.status(500).json({ error: 'Error al obtener KPIs de stock' });
    }
};

export const getProductosLista = async (req, res) => {
    try {
        const productos = await prisma.producto.findMany({
            where: { es_servicio: { not: true } },
            select: { id_producto: true, descripcion: true, codigo: true },
            orderBy: { descripcion: 'asc' },
        });
        return res.json(
            productos.map((p) => ({
                id: p.id_producto,
                nombre: p.descripcion,
                codigo: p.codigo,
            })),
        );
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return res.status(500).json({ error: 'Error al obtener productos' });
    }
};
