import { prisma } from '../lib/prisma.js';

// GET /api/asientos-contables
export const getAsientosContables = async (req, res) => {
    const { periodo } = req.query;
    try {
        const asientos = await prisma.asientos.findMany({
            where: periodo ? { id_proc_contable: Number(periodo) } : {},
            include: {
                asiento_detalle: {
                    include: {
                        plan_cuentas: true
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
        res.json(asientos);
    } catch (error) {
        console.error('Error al obtener asientos contables:', error);
        res.status(500).json({ error: 'Error al obtener asientos contables' });
    }
};

// POST /api/asientos-contables
export const createAsientoContable = async (req, res) => {
    const { fecha, descripcion, id_proc_contable, detalles } = req.body;

    if (!detalles || detalles.length < 2) {
        return res.status(400).json({ error: 'Un asiento debe tener al menos dos movimientos' });
    }

    // Validar partida doble
    const totalDebe = detalles
        .filter(d => d.debe_haber === true)
        .reduce((sum, d) => sum + Number(d.monto), 0);
    
    const totalHaber = detalles
        .filter(d => d.debe_haber === false)
        .reduce((sum, d) => sum + Number(d.monto), 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
        return res.status(400).json({ error: 'El asiento no está cuadrado (Debe != Haber)' });
    }

    try {
        const nuevoAsiento = await prisma.$transaction(async (tx) => {
            // Obtener el siguiente número de asiento
            const ultimoAsiento = await tx.asientos.findFirst({
                where: { id_proc_contable: id_proc_contable ? Number(id_proc_contable) : undefined },
                orderBy: { numero_asiento: 'desc' }
            });
            const proximoNumero = (ultimoAsiento?.numero_asiento || 0) + 1;

            return await tx.asientos.create({
                data: {
                    fecha: fecha ? new Date(fecha) : new Date(),
                    numero_asiento: proximoNumero,
                    descripcion,
                    total_debe: totalDebe,
                    total_haber: totalHaber,
                    id_proc_contable: id_proc_contable ? Number(id_proc_contable) : null,
                    estado: 'pendiente',
                    tabla_origen: 'asiento_manual',
                    asiento_detalle: {
                        create: detalles.map(d => ({
                            id_cuenta: Number(d.id_cuenta),
                            monto: Number(d.monto),
                            debe_haber: d.debe_haber
                        }))
                    }
                },
                include: {
                    asiento_detalle: true
                }
            });
        });

        res.status(201).json(nuevoAsiento);
    } catch (error) {
        console.error('Error al crear asiento contable:', error);
        res.status(500).json({ error: 'Error al crear asiento contable', details: error.message });
    }
};

// GET /api/asientos-contables/:id/detalle-origen
export const getDetalleOrigenAsiento = async (req, res) => {
    const { id } = req.params;
    try {
        const asiento = await prisma.asientos.findUnique({
            where: { id_asiento: Number(id) }
        });

        if (!asiento || !asiento.tabla_origen || asiento.tabla_origen === 'asiento_manual') {
            return res.json({ items: [] });
        }

        let items = [];

        if (asiento.tabla_origen === 'factura_compra') {
            const detalle = await prisma.detalle_factura.findMany({
                where: { id_factura_compra: Number(asiento.id_registro_origen) },
                include: { producto: true }
            });
            items = detalle.map(d => ({
                producto: d.producto?.descripcion || 'Producto desconocido',
                cantidad: Number(d.cantidad_recibida),
                precio_unitario: Number(d.precio_unitario),
                subtotal: Number(d.subtotal)
            }));
        } 
        else if (asiento.tabla_origen === 'nota_credito') {
            const nc = await prisma.nota_credito.findUnique({
                where: { id_nota_credito: Number(asiento.id_registro_origen) },
                include: {
                    pedido_devolucion: {
                        include: {
                            nota_credito_detalle: {
                                include: { producto: true }
                            }
                        }
                    }
                }
            });
            
            if (nc?.pedido_devolucion?.nota_credito_detalle) {
                items = nc.pedido_devolucion.nota_credito_detalle.map(d => ({
                    producto: d.producto?.descripcion || 'Producto desconocido',
                    cantidad: Number(d.producto_cantidad),
                    precio_unitario: Number(nc.monto_subtotal) / Number(d.producto_cantidad || 1),
                    subtotal: Number(nc.monto_subtotal)
                }));
            }
        }
        else if (asiento.tabla_origen === 'orden_pago_proveedores') {
            const op = await prisma.orden_pago_proveedores.findUnique({
                where: { id_orden_pago: Number(asiento.id_registro_origen) },
                include: {
                    detalle_orden_pago_facturas: {
                        include: {
                            factura_compra: {
                                include: {
                                    detalle_orden_pago_facturas: true
                                }
                            }
                        }
                    }
                }
            });

            if (op?.detalle_orden_pago_facturas) {
                items = op.detalle_orden_pago_facturas.map(d => {
                    const totalFactura = Number(d.factura_compra?.total ?? 0);
                    const montoPagadoEnEstaOp = Number(d.monto_pagado_factura ?? 0);
                    
                    const totalPagadoHistorico = (d.factura_compra?.detalle_orden_pago_facturas ?? []).reduce(
                        (acc, op_fac) => acc + Number(op_fac.monto_pagado_factura ?? 0),
                        0
                    );
                    const saldoPendiente = totalFactura - totalPagadoHistorico;
                    const esParcial = saldoPendiente > 0.009;

                    return {
                        nro_factura: d.factura_compra?.nro_factura ?? `FAC-P-${String(d.id_factura_compra).padStart(4, '0')}`,
                        total_factura: totalFactura,
                        monto_pagado: montoPagadoEnEstaOp,
                        es_parcial: esParcial
                    };
                });
            }
        }

        res.json({ items });
    } catch (error) {
        console.error('Error al obtener detalle de origen:', error);
        res.status(500).json({ error: 'Error al obtener detalle de origen' });
    }
};
