import { prisma } from '../lib/prisma.js';

// Auxiliar para lógica de saldos
export const calcularSaldos = (movs, saldoInicial = 0, saldoDisponibleInicial = 0) => {
    let saldoReal = Number(saldoInicial);
    let saldoDisponible = Number(saldoDisponibleInicial);

    movs.forEach((m) => {
        const ingreso = Number(m.monto_ingreso ?? 0);
        const egreso = Number(m.monto_egreso ?? 0);

        // Saldo Real siempre se afecta
        saldoReal += (ingreso - egreso);

        // Saldo Disponible
        if (egreso > 0) {
            if (m.fecha_confirmacion || m.tipo_deposito === 'Transferencia') {
                saldoDisponible -= egreso;
            }
        } else if (ingreso > 0) {
            if (m.fecha_confirmacion) {
                saldoDisponible += ingreso;
            }
        }
    });

    return { saldoReal, saldoDisponible };
};

// GET /api/movimientos-bancarios
export const getMovimientos = async (req, res) => {
    try {
        const movimientos = await prisma.movimiento_bancario.findMany({
            include: { cuenta_bancaria: { include: { banco: true } } },
            orderBy: { fecha_movimiento: 'desc' }
        });

        const data = movimientos.map((m) => ({
            id_movimiento: m.id_movimiento,
            id_cuenta: m.id_cuenta,
            monto_ingreso: Number(m.monto_ingreso ?? 0),
            monto_egreso: Number(m.monto_egreso ?? 0),
            fecha_movimiento: m.fecha_movimiento?.toISOString().split('T')[0] ?? '—',
            fecha_confirmacion: m.fecha_confirmacion?.toISOString().split('T')[0] ?? null,
            tipo_movimiento: m.tipo_movimiento,
            concepto: m.concepto || m.tipo_movimiento,
            tipo_deposito: m.tipo_deposito,
            banco: m.cuenta_bancaria?.banco?.nombre ?? '—',
        }));

        return res.json(data);
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        return res.status(500).json({ error: 'Error al obtener movimientos' });
    }
};

// POST /api/movimientos-bancarios
export const registrarMovimiento = async (req, res) => {
    const {
        id_cuenta,
        monto_ingreso,
        monto_egreso,
        fecha_movimiento,
        fecha_confirmacion,
        tipo_movimiento,
        concepto,
        tipo_deposito,
        confirmar_inmediato,
        es_manual
    } = req.body;

    if (!id_cuenta) return res.status(400).json({ error: 'La cuenta es requerida' });

    if (monto_egreso > 0) {
        const cuenta = await prisma.cuenta_bancaria.findUnique({
            where: { id_cuenta: Number(id_cuenta) },
            include: { movimiento_bancario: true }
        });
        if (cuenta) {
            const { saldoDisponible } = calcularSaldos(cuenta.movimiento_bancario, cuenta.saldo, cuenta.saldo_disponible);
            if (saldoDisponible < Number(monto_egreso)) {
                if (es_manual) {
                    return res.status(400).json({ error: `Saldo insuficiente. Disponible: Gs. ${saldoDisponible.toLocaleString('de-DE')}` });
                }
            }
        }
    }

    try {
        let f_conf = fecha_confirmacion ? new Date(fecha_confirmacion) : null;
        
        if (confirmar_inmediato || ['Efectivo', 'Cheque Mismo Banco', 'Transferencia'].includes(tipo_deposito)) {
            f_conf = new Date();
        }

        const movimiento = await prisma.movimiento_bancario.create({
            data: {
                cuenta_bancaria: {
                    connect: { id_cuenta: Number(id_cuenta) }
                },
                monto_ingreso: Number(monto_ingreso ?? 0),
                monto_egreso: Number(monto_egreso ?? 0),
                fecha_movimiento: fecha_movimiento ? new Date(fecha_movimiento) : new Date(),
                fecha_confirmacion: f_conf,
                tipo_movimiento: tipo_movimiento ?? 'Manual',
                concepto: concepto?.trim() || (tipo_movimiento === 'Crédito' ? 'Ingreso Manual' : 'Egreso Manual'),
                tipo_deposito: tipo_deposito,
            }
        });

        return res.status(201).json({
            id_movimiento: movimiento.id_movimiento,
            id_cuenta: movimiento.id_cuenta,
            monto_ingreso: Number(movimiento.monto_ingreso ?? 0),
            monto_egreso: Number(movimiento.monto_egreso ?? 0),
            fecha_movimiento: movimiento.fecha_movimiento?.toISOString().split('T')[0],
            fecha_confirmacion: movimiento.fecha_confirmacion?.toISOString().split('T')[0] ?? null,
            tipo_movimiento: movimiento.tipo_movimiento,
            concepto: movimiento.concepto || movimiento.tipo_movimiento,
            tipo_deposito: movimiento.tipo_deposito,
        });
    } catch (error) {
        return res.status(500).json({ 
            error: 'Error interno al registrar movimiento',
            detalle: error.message 
        });
    }
};

// PUT /api/movimientos-bancarios/confirmar
export const confirmarMovimientos = async (req, res) => {
    const { movimientoIds } = req.body;

    if (!movimientoIds?.length) {
        return res.status(400).json({ error: 'Seleccioná al menos un movimiento para confirmar' });
    }

    try {
        const hoy = new Date();
        await prisma.movimiento_bancario.updateMany({
            where: { id_movimiento: { in: movimientoIds.map(Number) } },
            data: { fecha_confirmacion: hoy }
        });

        return res.json({ ok: true, confirmados: movimientoIds.length });
    } catch (error) {
        console.error('Error al confirmar movimientos:', error);
        return res.status(500).json({ error: 'Error al confirmar movimientos' });
    }
};

// GET /api/movimientos-bancarios/estadisticas
export const getEstadisticasTesoreria = async (req, res) => {
    try {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        const movimientosMes = await prisma.movimiento_bancario.findMany({
            where: {
                fecha_movimiento: {
                    gte: inicioMes
                }
            }
        });

        const ingresosMes = movimientosMes.reduce((acc, m) => acc + Number(m.monto_ingreso ?? 0), 0);
        const egresosMes = movimientosMes.reduce((acc, m) => acc + Number(m.monto_egreso ?? 0), 0);

        const cuentas = await prisma.cuenta_bancaria.findMany({
            include: { movimiento_bancario: true }
        });

        let saldoTotalDisponible = 0;
        cuentas.forEach(c => {
            const { saldoDisponible } = calcularSaldos(c.movimiento_bancario, c.saldo, c.saldo_disponible);
            saldoTotalDisponible += saldoDisponible;
        });

        return res.json({
            ingresosMes,
            egresosMes,
            saldoTotalDisponible,
            cantidadMovimientosMes: movimientosMes.length
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de tesorería:', error);
        return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};
