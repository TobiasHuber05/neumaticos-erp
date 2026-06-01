import { prisma } from '../../lib/prisma.js';

// ─── Helper: rango de fechas ──────────────────────────────────────────────────
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

// ─── Helper: estado de cobro de una factura de venta ─────────────────────────
function calcularEstadoCobro(total, cobranzas) {
    const totalCobrado = cobranzas.reduce((acc, c) => {
        const detalle = c.detalle_cobranza ?? [];
        return acc + detalle.reduce((s, d) => s + Number(d.monto ?? 0), 0);
    }, 0);
    const saldo = Math.max(0, Number(total) - totalCobrado);
    if (totalCobrado <= 0) return { estadoCobro: 'Pendiente', totalCobrado, saldoPendiente: saldo };
    if (saldo > 0.009) return { estadoCobro: 'Parcial', totalCobrado, saldoPendiente: saldo };
    return { estadoCobro: 'Cobrada', totalCobrado, saldoPendiente: 0 };
}

// ─── GET /api/reportes-ventas/facturas ───────────────────────────────────────
// Reporte principal: facturas de venta con detalles y estado de cobro
// Query params: fechaDesde, fechaHasta, clienteId, estadoCobro
export const getReporteFacturas = async (req, res) => {
    const { fechaDesde, fechaHasta, clienteId, estadoCobro } = req.query;

    try {
        const fechaWhere = buildFechaWhere(fechaDesde, fechaHasta);

        const facturas = await prisma.factura_venta.findMany({
            where: {
                ...(fechaWhere && { fecha_emision: fechaWhere }),
                ...(clienteId && { id_cliente: Number(clienteId) }),
            },
            include: {
                cliente: true,
                presupuesto: true,
                detalle_factura_venta: {
                    include: {
                        producto_servicio: {
                            include: { producto: true }
                        }
                    }
                },
                cobranza: {
                    include: { detalle_cobranza: true }
                },
            },
            orderBy: { fecha_emision: 'desc' },
        });

        const data = facturas.map((fv) => {
            const total = Number(fv.total ?? 0);
            const { estadoCobro: eCobro, totalCobrado, saldoPendiente } =
                calcularEstadoCobro(total, fv.cobranza);

            const detalles = (fv.detalle_factura_venta ?? []).map((d) => ({
                productoId: d.id_producto_servicio,
                nombreProducto: d.producto_servicio?.producto?.descripcion ?? d.producto_servicio?.descripcion ?? '—',
                esServicio: d.producto_servicio?.producto?.es_servicio ?? false,
                cantidad: Number(d.cantidad ?? 0),
                precioUnitario: Number(d.precio_unitario ?? 0),
                iva: Number(d.iva ?? 0),
                subtotal: Number(d.subtotal ?? 0),
                total: Number(d.total ?? 0),
            }));

            return {
                id: fv.id_factura_venta,
                numero: fv.nro_factura ?? `FAC-V-${String(fv.id_factura_venta).padStart(4, '0')}`,
                timbrado: fv.timbrado ?? '—',
                fecha: fv.fecha_emision?.toISOString().split('T')[0] ?? '—',
                fechaVencimiento: fv.fecha_vencimiento?.toISOString().split('T')[0] ?? null,
                contadoCredito: fv.contado_credito ?? '—',
                clienteId: fv.id_cliente,
                cliente: fv.cliente
                    ? `${fv.cliente.nombre ?? ''} ${fv.cliente.apellido ?? ''}`.trim() || '—'
                    : 'Consumidor Final',
                presupuestoId: fv.id_presupuesto ?? null,
                cantidadItems: detalles.length,
                total,
                totalCobrado,
                saldoPendiente,
                estadoCobro: eCobro,
                detalles,
            };
        });

        const resultado = estadoCobro
            ? data.filter((f) => f.estadoCobro === estadoCobro)
            : data;

        return res.json(resultado);
    } catch (error) {
        console.error('Error en reporte de ventas:', error);
        return res.status(500).json({ error: 'Error al obtener reporte de ventas' });
    }
};

// ─── GET /api/reportes-ventas/kpis ───────────────────────────────────────────
// KPIs del período: total facturado, cobrado, pendiente, cantidad de facturas
// Query params: fechaDesde, fechaHasta, clienteId
export const getKpisVentas = async (req, res) => {
    const { fechaDesde, fechaHasta, clienteId } = req.query;

    try {
        const fechaWhere = buildFechaWhere(fechaDesde, fechaHasta);

        const facturas = await prisma.factura_venta.findMany({
            where: {
                ...(fechaWhere && { fecha_emision: fechaWhere }),
                ...(clienteId && { id_cliente: Number(clienteId) }),
            },
            include: {
                detalle_factura_venta: true,
                cobranza: { include: { detalle_cobranza: true } },
            },
        });

        const totalFacturado = facturas.reduce((acc, f) => acc + Number(f.total ?? 0), 0);

        const totalCobrado = facturas.reduce((acc, f) => {
            return acc + f.cobranza.reduce((s, c) => {
                return s + (c.detalle_cobranza ?? []).reduce((t, d) => t + Number(d.monto ?? 0), 0);
            }, 0);
        }, 0);

        const saldoPendiente = Math.max(0, totalFacturado - totalCobrado);

        const cantidadItems = facturas.reduce((acc, f) => {
            return acc + f.detalle_factura_venta.reduce((s, d) => s + Number(d.cantidad ?? 0), 0);
        }, 0);

        const promedioPorFactura = facturas.length > 0 ? totalFacturado / facturas.length : 0;

        return res.json({
            totalFacturado,
            totalCobrado,
            saldoPendiente,
            cantidadFacturas: facturas.length,
            cantidadItems,
            promedioPorFactura,
        });
    } catch (error) {
        console.error('Error en KPIs de ventas:', error);
        return res.status(500).json({ error: 'Error al obtener KPIs de ventas' });
    }
};

// ─── GET /api/reportes-ventas/clientes-lista ─────────────────────────────────
export const getClientesLista = async (req, res) => {
    try {
        const clientes = await prisma.cliente.findMany({
            select: { id_cliente: true, nombre: true, apellido: true },
            orderBy: { nombre: 'asc' },
        });
        return res.json(
            clientes.map((c) => ({
                id: c.id_cliente,
                nombre: `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim() || '—',
            })),
        );
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        return res.status(500).json({ error: 'Error al obtener clientes' });
    }
};
