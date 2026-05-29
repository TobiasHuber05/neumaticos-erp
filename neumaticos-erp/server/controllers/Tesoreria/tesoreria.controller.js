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
        const cuentas = await prisma.cuenta_bancaria.findMany({
            include: {
                banco: true,
                monedas: true,
                movimiento_bancario: true
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
    const { id_banco, id_moneda, numero_cuenta, tipo_cuenta, saldo, saldo_disponible } = req.body;

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
            },
            include: { banco: true, monedas: true }
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
        });
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        return res.status(500).json({ error: 'Error al crear cuenta' });
    }
};

// PUT /api/tesoreria/cuentas/:id
export const actualizarCuenta = async (req, res) => {
    const { id } = req.params;
    const { id_banco, id_moneda, numero_cuenta, tipo_cuenta, saldo, saldo_disponible } = req.body;

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
            },
            include: { banco: true, monedas: true }
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
        });
    } catch (error) {
        console.error('Error al actualizar cuenta:', error);
        return res.status(500).json({ error: 'Error al actualizar cuenta' });
    }
};

