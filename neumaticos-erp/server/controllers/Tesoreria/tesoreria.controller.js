import { prisma } from '../../lib/prisma.js';
import { calcularSaldos } from './movimientos.controller.js';

// GET /api/tesoreria/bancos
export const getBancos = async (req, res) => {
    try {
        const bancos = await prisma.banco.findMany({
            orderBy: { nombre: 'asc' }
        });
        return res.json(bancos.map((b) => ({
            id_banco: b.id_banco,
            nombre: b.nombre,
            codigo: b.codigo,
        })));
    } catch (error) {
        console.error('Error al obtener bancos:', error);
        return res.status(500).json({ error: 'Error al obtener bancos' });
    }
};

// GET /api/tesoreria/monedas
export const getMonedas = async (req, res) => {
    try {
        const monedas = await prisma.monedas.findMany({
            orderBy: { nombre: 'asc' }
        });
        return res.json(monedas.map((m) => ({
            id_moneda: m.id_moneda,
            nombre: m.nombre,
        })));
    } catch (error) {
        console.error('Error al obtener monedas:', error);
        return res.status(500).json({ error: 'Error al obtener monedas' });
    }
};

// GET /api/tesoreria/cuentas
export const getCuentas = async (req, res) => {
    try {
        const incluirInactivas = req.query.incluirInactivas === 'true';

        const cuentas = await prisma.cuenta_bancaria.findMany({
            where: incluirInactivas ? {} : { activa: true },
            include: {
                banco: true,
                monedas: true,
                movimiento_bancario: true,
                plan_cuentas: true,
            },
            orderBy: { id_cuenta: 'asc' }
        });

        const data = cuentas.map((c) => {
            const { saldoReal, saldoDisponible } = calcularSaldos(
                c.movimiento_bancario ?? [],
                c.saldo ?? 0,
                c.saldo_disponible ?? 0
            );

            return {
                id_cuenta: c.id_cuenta,
                id_banco: c.id_banco,
                id_moneda: c.id_moneda,
                numero_cuenta: c.numero_cuenta?.trim(),
                tipo_cuenta: c.tipo_cuenta,
                saldo_inicial: Number(c.saldo ?? 0),
                saldo_disponible_inicial: Number(c.saldo_disponible ?? 0),
                saldo: saldoReal,
                saldo_disponible: saldoDisponible,
                banco: c.banco?.nombre ?? '—',
                moneda: c.monedas?.nombre ?? '—',
                activa: c.activa,
                id_cuenta_contable: c.id_cuenta_contable,
                cuenta_contable_nombre: c.plan_cuentas ? `${c.plan_cuentas.cuenta_contable} - ${c.plan_cuentas.nombre}` : null,
            };
        });

        return res.json(data);
    } catch (error) {
        console.error('Error al obtener cuentas:', error);
        return res.status(500).json({ error: 'Error al obtener cuentas' });
    }
};

// POST /api/tesoreria/cuentas
export const crearCuenta = async (req, res) => {
    const { id_banco, id_moneda, numero_cuenta, tipo_cuenta, saldo, saldo_disponible, id_cuenta_contable } = req.body;

    if (!id_banco || !id_moneda || !numero_cuenta) {
        return res.status(400).json({ error: 'Banco, moneda y número de cuenta son requeridos' });
    }

    try {
        const cuenta = await prisma.cuenta_bancaria.create({
            data: {
                id_banco: Number(id_banco),
                id_moneda: Number(id_moneda),
                numero_cuenta: numero_cuenta.trim(),
                tipo_cuenta: tipo_cuenta ?? 'Cuenta Corriente',
                saldo: Number(saldo ?? 0),
                saldo_disponible: Number(saldo_disponible ?? 0),
                id_cuenta_contable: id_cuenta_contable ? Number(id_cuenta_contable) : null,
            },
            include: { banco: true, monedas: true, plan_cuentas: true }
        });

        const saldoInicial = Number(cuenta.saldo ?? 0);
        const saldoDispInicial = Number(cuenta.saldo_disponible ?? 0);

        return res.status(201).json({
            id_cuenta: cuenta.id_cuenta,
            id_banco: cuenta.id_banco,
            id_moneda: cuenta.id_moneda,
            numero_cuenta: cuenta.numero_cuenta?.trim(),
            tipo_cuenta: cuenta.tipo_cuenta,
            saldo_inicial: saldoInicial,
            saldo_disponible_inicial: saldoDispInicial,
            saldo: saldoInicial,
            saldo_disponible: saldoDispInicial,
            banco: cuenta.banco?.nombre ?? '—',
            moneda: cuenta.monedas?.nombre ?? '—',
            id_cuenta_contable: cuenta.id_cuenta_contable,
            cuenta_contable_nombre: cuenta.plan_cuentas?.nombre ?? null,
        });
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        return res.status(500).json({ error: 'Error al crear cuenta' });
    }
};

// PUT /api/tesoreria/cuentas/:id
export const actualizarCuenta = async (req, res) => {
    const { id } = req.params;
    const { id_banco, id_moneda, numero_cuenta, tipo_cuenta, saldo, saldo_disponible, id_cuenta_contable } = req.body;

    try {
        const cuenta = await prisma.cuenta_bancaria.update({
            where: { id_cuenta: Number(id) },
            data: {
                id_banco: Number(id_banco),
                id_moneda: Number(id_moneda),
                numero_cuenta: numero_cuenta.trim(),
                tipo_cuenta: tipo_cuenta,
                saldo: Number(saldo ?? 0),
                saldo_disponible: Number(saldo_disponible ?? 0),
                id_cuenta_contable: id_cuenta_contable ? Number(id_cuenta_contable) : null,
            },
            include: { banco: true, monedas: true, plan_cuentas: true }
        });

        return res.json({
            id_cuenta: cuenta.id_cuenta,
            id_banco: cuenta.id_banco,
            id_moneda: cuenta.id_moneda,
            numero_cuenta: cuenta.numero_cuenta?.trim(),
            tipo_cuenta: cuenta.tipo_cuenta,
            saldo: Number(cuenta.saldo ?? 0),
            saldo_disponible: Number(cuenta.saldo_disponible ?? 0),
            banco: cuenta.banco?.nombre ?? '—',
            moneda: cuenta.monedas?.nombre ?? '—',
            id_cuenta_contable: cuenta.id_cuenta_contable,
            cuenta_contable_nombre: cuenta.plan_cuentas ? `${cuenta.plan_cuentas.cuenta_contable} - ${cuenta.plan_cuentas.nombre}` : null,
        });
    } catch (error) {
        console.error('Error al actualizar cuenta:', error);
        return res.status(500).json({ error: 'Error al actualizar cuenta' });
    }
};

// PUT /api/tesoreria/cuentas/:id/desactivar
export const desactivarCuenta = async (req, res) => {
    const { id } = req.params;
    try {
        const cuenta = await prisma.cuenta_bancaria.update({
            where: { id_cuenta: Number(id) },
            data: { activa: false },
        });
        return res.json({ ok: true, id_cuenta: cuenta.id_cuenta, activa: false });
    } catch (error) {
        console.error('Error al desactivar cuenta:', error);
        return res.status(500).json({ error: 'Error al desactivar cuenta' });
    }
};

// PUT /api/tesoreria/cuentas/:id/reactivar
export const reactivarCuenta = async (req, res) => {
    const { id } = req.params;
    try {
        const cuenta = await prisma.cuenta_bancaria.update({
            where: { id_cuenta: Number(id) },
            data: { activa: true },
        });
        return res.json({ ok: true, id_cuenta: cuenta.id_cuenta, activa: true });
    } catch (error) {
        console.error('Error al reactivar cuenta:', error);
        return res.status(500).json({ error: 'Error al reactivar cuenta' });
    }
};

// DELETE /api/tesoreria/cuentas/:id
export const eliminarCuenta = async (req, res) => {
    const { id } = req.params;

    try {
        const tieneMovimientos = await prisma.movimiento_bancario.findFirst({
            where: { id_cuenta: Number(id) }
        });
        if (tieneMovimientos) {
            return res.status(400).json({ error: 'No se puede eliminar una cuenta que tiene movimientos registrados' });
        }

        const tieneCheques = await prisma.cheques_emitidos.findFirst({
            where: { id_cuenta: Number(id) }
        });
        if (tieneCheques) {
            return res.status(400).json({ error: 'No se puede eliminar una cuenta que tiene cheques emitidos' });
        }

        const tieneTransferencias = await prisma.transferencias_emitidas.findFirst({
            where: { id_cuenta: Number(id) }
        });
        if (tieneTransferencias) {
            return res.status(400).json({ error: 'No se puede eliminar una cuenta que tiene transferencias emitidas' });
        }

        const tieneConciliaciones = await prisma.conciliacion_bancaria.findFirst({
            where: { id_cuenta: Number(id) }
        });
        if (tieneConciliaciones) {
            return res.status(400).json({ error: 'No se puede eliminar una cuenta que tiene conciliaciones registradas' });
        }

        await prisma.cuenta_bancaria.delete({
            where: { id_cuenta: Number(id) }
        });

        return res.json({ ok: true, message: 'Cuenta eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        return res.status(500).json({ error: 'Error al eliminar cuenta' });
    }
};

