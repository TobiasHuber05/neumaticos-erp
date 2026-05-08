import { prisma } from '../lib/prisma.js';

/**
 * Genera un asiento contable automático para una transacción.
 * 
 * @param {Object} params 
 * @param {Date} params.fecha - Fecha del asiento
 * @param {string} params.descripcion - Descripción del asiento
 * @param {string} params.tabla_origen - Tabla que originó el movimiento (ej: 'factura_venta')
 * @param {number} params.id_registro_origen - ID del registro en la tabla origen
 * @param {Array} params.detalles - Array de { cuenta_codigo, monto, debe_haber, glosa }
 */
export const registrarAsientoAutomatico = async ({
    fecha,
    descripcion,
    tabla_origen,
    id_registro_origen,
    detalles
}) => {
    try {
        // 1. Buscar periodo contable abierto
        const periodoActivo = await prisma.proceso_contable.findFirst({
            where: { estado: 'Abierto' },
            orderBy: { fecha_inicio: 'desc' }
        });

        if (!periodoActivo) {
            console.warn('⚠️ No hay un periodo contable abierto. No se pudo generar el asiento automático.');
            return null;
        }

        // 2. Resolver IDs de cuentas contables por código
        const detallesConId = await Promise.all(detalles.map(async (d) => {
            let cuenta = await prisma.plan_cuentas.findFirst({
                where: { cuenta_contable: d.cuenta_codigo }
            });

            // Si no existe la cuenta, la creamos con un nombre genérico para no romper el flujo
            if (!cuenta) {
                console.info(`ℹ️ Creando cuenta contable inexistente: ${d.cuenta_codigo}`);
                cuenta = await prisma.plan_cuentas.create({
                    data: {
                        cuenta_contable: d.cuenta_codigo,
                        nombre: d.glosa || `Cuenta Automática ${d.cuenta_codigo}`,
                        asentable: true,
                        id_proc_contable: periodoActivo.id_proc_contable,
                        nivel: 1
                    }
                });
            }

            return {
                id_cuenta: cuenta.id_cuenta,
                monto: d.monto,
                debe_haber: d.debe_haber
            };
        }));

        // 3. Validar partida doble
        const totalDebe = detallesConId
            .filter(d => d.debe_haber === true)
            .reduce((sum, d) => sum + Number(d.monto), 0);
        
        const totalHaber = detallesConId
            .filter(d => d.debe_haber === false)
            .reduce((sum, d) => sum + Number(d.monto), 0);

        if (Math.abs(totalDebe - totalHaber) > 0.01) {
            throw new Error(`Partida doble no balanceada: Debe=${totalDebe}, Haber=${totalHaber}`);
        }

        // 4. Obtener siguiente número de asiento
        const ultimoAsiento = await prisma.asientos.findFirst({
            where: { id_proc_contable: periodoActivo.id_proc_contable },
            orderBy: { numero_asiento: 'desc' }
        });
        const nroAsiento = (ultimoAsiento?.numero_asiento || 0) + 1;

        // 5. Crear el asiento
        const asiento = await prisma.asientos.create({
            data: {
                fecha: fecha || new Date(),
                numero_asiento: nroAsiento,
                descripcion,
                total_debe: totalDebe,
                total_haber: totalHaber,
                estado: 'confirmado',
                tabla_origen,
                id_registro_origen,
                id_proc_contable: periodoActivo.id_proc_contable,
                asiento_detalle: {
                    create: detallesConId.map(d => ({
                        id_cuenta: d.id_cuenta,
                        monto: d.monto,
                        debe_haber: d.debe_haber
                    }))
                }
            },
            include: {
                asiento_detalle: true
            }
        });

        console.log(`✅ Asiento contable generado con éxito: ID ${asiento.id_asiento}`);
        return asiento;

    } catch (error) {
        console.error('❌ Error al registrar asiento automático:', error);
        // No lanzamos error para no bloquear la transacción principal (ej: la venta)
        // pero lo registramos en consola.
        return null;
    }
};
