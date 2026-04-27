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
