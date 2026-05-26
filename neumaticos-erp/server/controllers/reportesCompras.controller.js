import { prisma } from '../lib/prisma.js';

// ─── Helper: construye el where de fecha según query params ───────────────────
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

// ─── Helper: calcula estado de pago de una factura ───────────────────────────
function calcularEstadoPago(total, pagos) {
    const totalPagado = pagos.reduce((acc, d) => acc + Number(d.monto_pagado_factura ?? 0), 0);
    const saldo = Math.max(0, total - totalPagado);
    if (totalPagado <= 0) return { estadoPago: 'Pendiente', totalPagado, saldoPendiente: saldo };
    if (saldo > 0.009) return { estadoPago: 'Parcial', totalPagado, saldoPendiente: saldo };
    return { estadoPago: 'Pagada', totalPagado, saldoPendiente: 0 };
}

// ─── GET /api/reportes-compras/ordenes ───────────────────────────────────────
// Reporte principal: órdenes de compra con sus facturas y estado de pago
// Query params: fechaDesde, fechaHasta, proveedorId, estadoPago
export const getReporteOrdenes = async (req, res) => {
    const { fechaDesde, fechaHasta, proveedorId, estadoPago } = req.query;

    try {
        const fechaWhere = buildFechaWhere(fechaDesde, fechaHasta);

        const ordenes = await prisma.orden_compra.findMany({
            where: {
                ...(fechaWhere && { fecha: fechaWhere }),
                ...(proveedorId && { id_proveedor: Number(proveedorId) }),
            },
            include: {
                proveedores: true,
                cotizacion: {
                    include: {
                        detalle_cotizacion: {
                            where: { seleccionado: true },
                            include: { producto: true },
                        },
                        pedidos_productos: { include: { detalles_pedidos: true } },
                    },
                },
                factura_compra: {
                    include: {
                        detalle_factura: { include: { producto: true } },
                        detalle_orden_pago_facturas: {
                            select: { monto_pagado_factura: true },
                        },
                    },
                },
            },
            orderBy: { fecha: 'desc' },
        });

        const data = ordenes.map((oc) => {
            // Líneas de la OC desde la cotización adjudicada
            const lineasCot = oc.cotizacion?.detalle_cotizacion ?? [];
            const lineasPed = oc.cotizacion?.pedidos_productos?.detalles_pedidos ?? [];

            const lineas = lineasCot.map((d) => {
                const ped = lineasPed.find((p) => p.id_producto === d.id_producto);
                return {
                    productoId: d.id_producto,
                    nombreProducto: d.producto?.descripcion ?? '—',
                    cantidadPedida: Number(ped?.cantidad ?? 1),
                    precioUnitario: Number(d.precio ?? 0),
                };
            });

            const cantidadItems = lineas.length;

            // Totales desde facturas reales recibidas
            const facturas = oc.factura_compra.map((f) => {
                const total = Number(f.total ?? 0);
                const { estadoPago: epago, totalPagado, saldoPendiente } = calcularEstadoPago(
                    total,
                    f.detalle_orden_pago_facturas,
                );
                return {
                    id: f.id_factura_compra,
                    numero: f.nro_factura ?? `FAC-P-${String(f.id_factura_compra).padStart(4, '0')}`,
                    timbrado: f.timbrado ?? '—',
                    fecha: f.fecha_emision?.toISOString().split('T')[0] ?? '—',
                    total,
                    totalPagado,
                    saldoPendiente,
                    estadoPago: epago,
                };
            });

            const montoTotal = facturas.reduce((acc, f) => acc + f.total, 0);
            const totalPagadoOC = facturas.reduce((acc, f) => acc + f.totalPagado, 0);
            const saldoOC = Math.max(0, montoTotal - totalPagadoOC);

            // Estado de pago consolidado de la OC
            let estadoPagoOC = 'Sin factura';
            if (facturas.length > 0) {
                if (saldoOC <= 0.009) estadoPagoOC = 'Pagada';
                else if (totalPagadoOC > 0) estadoPagoOC = 'Parcial';
                else estadoPagoOC = 'Pendiente';
            }

            // Estado de entrega
            const facturada = {};
            for (const f of oc.factura_compra) {
                for (const d of f.detalle_factura) {
                    facturada[d.id_producto] = (facturada[d.id_producto] ?? 0) + Number(d.cantidad_recibida ?? 0);
                }
            }
            const tienePendiente = lineas.some(
                (l) => Number(l.cantidadPedida) > (facturada[l.productoId] ?? 0),
            );
            const estadoEntrega = lineas.length === 0
                ? 'Sin líneas'
                : tienePendiente
                    ? 'Pendiente entrega'
                    : 'Cerrada';

            return {
                id: oc.id_orden_compra,
                numero: `OC-${String(oc.id_orden_compra).padStart(4, '0')}`,
                fecha: oc.fecha?.toISOString().split('T')[0] ?? '—',
                proveedorId: oc.id_proveedor,
                proveedor: oc.proveedores?.nombre ?? '—',
                cantidadItems,
                montoTotal,
                totalPagado: totalPagadoOC,
                saldoPendiente: saldoOC,
                estadoPago: estadoPagoOC,
                estadoEntrega,
                facturas,
                lineas,
            };
        });

        // Filtro por estadoPago si viene en el query (se aplica post-cálculo)
        const resultado = estadoPago
            ? data.filter((o) => o.estadoPago === estadoPago)
            : data;

        return res.json(resultado);
    } catch (error) {
        console.error('Error en reporte de órdenes:', error);
        return res.status(500).json({ error: 'Error al obtener reporte de órdenes' });
    }
};

// ─── GET /api/reportes-compras/kpis ──────────────────────────────────────────
// KPIs del período: total invertido, cantidad de OC, cantidad de productos, promedio por OC
// Query params: fechaDesde, fechaHasta, proveedorId
export const getKpis = async (req, res) => {
    const { fechaDesde, fechaHasta, proveedorId } = req.query;

    try {
        const fechaWhere = buildFechaWhere(fechaDesde, fechaHasta);

        const facturas = await prisma.factura_compra.findMany({
            where: {
                ...(fechaWhere && { fecha_emision: fechaWhere }),
                ...(proveedorId && { id_proveedor: Number(proveedorId) }),
            },
            include: {
                detalle_factura: true,
                detalle_orden_pago_facturas: {
                    select: { monto_pagado_factura: true },
                },
            },
        });

        const ordenesCount = await prisma.orden_compra.count({
            where: {
                ...(fechaWhere && { fecha: fechaWhere }),
                ...(proveedorId && { id_proveedor: Number(proveedorId) }),
            },
        });

        const totalInversion = facturas.reduce((acc, f) => acc + Number(f.total ?? 0), 0);

        const cantidadProductos = facturas.reduce((acc, f) => {
            return acc + f.detalle_factura.reduce((s, d) => s + Number(d.cantidad_recibida ?? 0), 0);
        }, 0);

        const promedioPorOC = ordenesCount > 0 ? totalInversion / ordenesCount : 0;

        const totalPagado = facturas.reduce((acc, f) => {
            return acc + f.detalle_orden_pago_facturas.reduce(
                (s, d) => s + Number(d.monto_pagado_factura ?? 0), 0,
            );
        }, 0);

        const saldoPendiente = Math.max(0, totalInversion - totalPagado);

        return res.json({
            totalInversion,
            cantidadOrdenes: ordenesCount,
            cantidadProductos,
            promedioPorOC,
            totalPagado,
            saldoPendiente,
        });
    } catch (error) {
        console.error('Error en KPIs de compras:', error);
        return res.status(500).json({ error: 'Error al obtener KPIs' });
    }
};

// ─── GET /api/reportes-compras/proveedores-lista ─────────────────────────────
// Devuelve lista de proveedores para el filtro del frontend
export const getProveedoresLista = async (req, res) => {
    try {
        const proveedores = await prisma.proveedores.findMany({
            select: { id_proveedor: true, nombre: true },
            orderBy: { nombre: 'asc' },
        });
        return res.json(
            proveedores.map((p) => ({ id: p.id_proveedor, nombre: p.nombre })),
        );
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        return res.status(500).json({ error: 'Error al obtener proveedores' });
    }
};