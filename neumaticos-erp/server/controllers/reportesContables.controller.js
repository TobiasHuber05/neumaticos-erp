import { prisma } from '../lib/prisma.js';

// GET /api/reportes-contables/libro-diario?periodo=ID
export const getLibroDiario = async (req, res) => {
    const { periodo } = req.query;
    try {
        const asientos = await prisma.asientos.findMany({
            where: { id_proc_contable: Number(periodo) },
            include: {
                asiento_detalle: {
                    include: {
                        plan_cuentas: true
                    }
                }
            },
            orderBy: { fecha: 'asc' }
        });
        res.json(asientos);
    } catch (error) {
        console.error('Error Libro Diario:', error);
        res.status(500).json({ error: 'Error al generar Libro Diario' });
    }
};

// GET /api/reportes-contables/libro-mayor?periodo=ID&cuenta=ID
export const getLibroMayor = async (req, res) => {
    const { periodo, cuenta } = req.query;
    try {
        const movimientos = await prisma.asiento_detalle.findMany({
            where: {
                id_cuenta: Number(cuenta),
                asientos: {
                    id_proc_contable: Number(periodo)
                }
            },
            include: {
                asientos: true
            },
            orderBy: {
                asientos: {
                    fecha: 'asc'
                }
            }
        });
        res.json(movimientos);
    } catch (error) {
        console.error('Error Libro Mayor:', error);
        res.status(500).json({ error: 'Error al generar Libro Mayor' });
    }
};

// GET /api/reportes-contables/sumas-saldos?periodo=ID
export const getSumasSaldos = async (req, res) => {
    const { periodo } = req.query;
    try {
        // Obtenemos todas las cuentas que tienen movimientos en el periodo
        const cuentas = await prisma.plan_cuentas.findMany({
            where: {
                asentable: true
            },
            include: {
                asiento_detalle: {
                    where: {
                        asientos: {
                            id_proc_contable: Number(periodo)
                        }
                    }
                }
            }
        });

        const balance = cuentas.map(cuenta => {
            const totalDebe = cuenta.asiento_detalle
                .filter(d => d.debe_haber === true)
                .reduce((sum, d) => sum + Number(d.monto), 0);
            
            const totalHaber = cuenta.asiento_detalle
                .filter(d => d.debe_haber === false)
                .reduce((sum, d) => sum + Number(d.monto), 0);

            const saldo = totalDebe - totalHaber;

            return {
                id_cuenta: cuenta.id_cuenta,
                codigo: cuenta.cuenta_contable,
                nombre: cuenta.nombre,
                debe: totalDebe,
                haber: totalHaber,
                saldo_deudor: saldo > 0 ? saldo : 0,
                saldo_acreedor: saldo < 0 ? Math.abs(saldo) : 0
            };
        }).filter(b => b.debe > 0 || b.haber > 0); // Solo cuentas con movimiento

        res.json(balance);
    } catch (error) {
        console.error('Error Sumas y Saldos:', error);
        res.status(500).json({ error: 'Error al generar Balance de Sumas y Saldos' });
    }
};
