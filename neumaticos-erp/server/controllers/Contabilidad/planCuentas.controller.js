import { prisma } from '../../lib/prisma.js';

// GET /api/contabilidad/plan-cuentas
// Opcionalmente filtrar por periodo: ?id_periodo=1
// Incluye cuentas del periodo seleccionado + cuentas sin periodo (NULL)
export const getPlanCuentas = async (req, res) => {
    const { id_periodo, periodo } = req.query;
    const filtroPeriodo = id_periodo || periodo;

    try {
        const cuentas = await prisma.plan_cuentas.findMany({
            where: filtroPeriodo
                ? {
                    OR: [
                        { id_proc_contable: Number(filtroPeriodo) },
                        { id_proc_contable: null }
                    ]
                  }
                : {},
            orderBy: { cuenta_contable: 'asc' }
        });

        return res.json(cuentas.map((c) => ({
            id: c.id_cuenta,
            id_cuenta: c.id_cuenta,
            codigo: c.cuenta_contable ?? '',
            cuenta_contable: c.cuenta_contable ?? '',
            nombre: c.nombre ?? '',
            tipo: c.asentable ? 'Asentable' : 'Totalizadora',
            asentable: c.asentable ?? false,
            nivel: c.nivel ?? 1,
            padreId: c.cuenta_padre ?? null,
            cuenta_padre: c.cuenta_padre ?? null,
            tipoCuenta: c.tipo_cuenta ?? '',
            tipo_cuenta: c.tipo_cuenta ?? '',
            idProcContable: c.id_proc_contable ?? null,
            id_proc_contable: c.id_proc_contable ?? null,
            debe: Number(c.debe ?? 0),
            haber: Number(c.haber ?? 0),
        })));
    } catch (error) {
        console.error('Error al obtener plan de cuentas:', error);
        return res.status(500).json({ error: 'Error al obtener plan de cuentas' });
    }
};

// GET /api/contabilidad/plan-cuentas/todas
// Retorna TODAS las cuentas contables sin filtro de periodo (para selects)
export const getTodasCuentas = async (req, res) => {
    try {
        const cuentas = await prisma.plan_cuentas.findMany({
            orderBy: { cuenta_contable: 'asc' }
        });

        return res.json(cuentas.map((c) => ({
            id: c.id_cuenta,
            id_cuenta: c.id_cuenta,
            codigo: c.cuenta_contable ?? '',
            cuenta_contable: c.cuenta_contable ?? '',
            nombre: c.nombre ?? '',
            tipo: c.asentable ? 'Asentable' : 'Totalizadora',
            asentable: c.asentable ?? false,
            nivel: c.nivel ?? 1,
            tipo_cuenta: c.tipo_cuenta ?? '',
        })));
    } catch (error) {
        console.error('Error al obtener todas las cuentas:', error);
        return res.status(500).json({ error: 'Error al obtener cuentas' });
    }
};

// POST /api/contabilidad/plan-cuentas
export const createCuenta = async (req, res) => {
    const { id_proc_contable, cuenta_contable, nombre, asentable, cuenta_padre, tipo_cuenta, nivel } = req.body;

    if (!nombre || !cuenta_contable) {
        return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }

    try {
        // Si se especifica periodo, verificar que esté abierto
        if (id_proc_contable) {
            const periodo = await prisma.proceso_contable.findUnique({
                where: { id_proc_contable: Number(id_proc_contable) }
            });
            if (!periodo) return res.status(404).json({ error: 'Periodo contable no encontrado' });
            if (periodo.estado !== 'Abierto') {
                return res.status(400).json({ error: 'No se pueden crear cuentas en un periodo cerrado' });
            }
        }

        // Verificar que no exista una cuenta con el mismo código en el mismo periodo
        const existente = await prisma.plan_cuentas.findFirst({
            where: {
                cuenta_contable,
                id_proc_contable: id_proc_contable ? Number(id_proc_contable) : null
            }
        });
        if (existente) {
            return res.status(409).json({ error: `Ya existe una cuenta con el código ${cuenta_contable}` });
        }

        const nueva = await prisma.plan_cuentas.create({
            data: {
                id_proc_contable: id_proc_contable ? Number(id_proc_contable) : null,
                cuenta_contable: String(cuenta_contable),
                nombre: String(nombre),
                asentable: asentable === undefined ? true : Boolean(asentable),
                cuenta_padre: cuenta_padre ? Number(cuenta_padre) : null,
                tipo_cuenta: tipo_cuenta || null,
                nivel: nivel ? Number(nivel) : 1,
            }
        });

        return res.status(201).json({
            id: nueva.id_cuenta,
            id_cuenta: nueva.id_cuenta,
            codigo: nueva.cuenta_contable ?? '',
            cuenta_contable: nueva.cuenta_contable ?? '',
            nombre: nueva.nombre ?? '',
            tipo: nueva.asentable ? 'Asentable' : 'Totalizadora',
            asentable: nueva.asentable ?? false,
            nivel: nueva.nivel ?? 1,
            padreId: nueva.cuenta_padre ?? null,
            cuenta_padre: nueva.cuenta_padre ?? null,
            tipoCuenta: nueva.tipo_cuenta ?? '',
            tipo_cuenta: nueva.tipo_cuenta ?? '',
            idProcContable: nueva.id_proc_contable ?? null,
            id_proc_contable: nueva.id_proc_contable ?? null,
            debe: Number(nueva.debe ?? 0),
            haber: Number(nueva.haber ?? 0),
        });
    } catch (error) {
        console.error('ERROR:', error);
        return res.status(500).json({ error: error.message });
    }
};

// PUT /api/contabilidad/plan-cuentas/:id
export const updateCuenta = async (req, res) => {
    const { id } = req.params;
    const { cuenta_contable, nombre, asentable, cuenta_padre, tipo_cuenta, nivel } = req.body;

    try {
        const cuenta = await prisma.plan_cuentas.findUnique({
            where: { id_cuenta: Number(id) },
            include: { proceso_contable: true }
        });

        if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });

        if (cuenta.proceso_contable?.estado === 'Cerrado') {
            return res.status(400).json({ error: 'No se pueden modificar cuentas de un periodo cerrado' });
        }

        const actualizada = await prisma.plan_cuentas.update({
            where: { id_cuenta: Number(id) },
            data: {
                cuenta_contable,
                nombre,
                asentable: asentable ?? cuenta.asentable,
                cuenta_padre: cuenta_padre !== undefined ? (cuenta_padre ? Number(cuenta_padre) : null) : cuenta.cuenta_padre,
                tipo_cuenta: tipo_cuenta ?? cuenta.tipo_cuenta,
                nivel: nivel ? Number(nivel) : cuenta.nivel,
            }
        });

        return res.json({
            id: actualizada.id_cuenta,
            id_cuenta: actualizada.id_cuenta,
            codigo: actualizada.cuenta_contable ?? '',
            cuenta_contable: actualizada.cuenta_contable ?? '',
            nombre: actualizada.nombre ?? '',
            tipo: actualizada.asentable ? 'Asentable' : 'Totalizadora',
            asentable: actualizada.asentable ?? false,
            nivel: actualizada.nivel ?? 1,
            padreId: actualizada.cuenta_padre ?? null,
            cuenta_padre: actualizada.cuenta_padre ?? null,
            tipoCuenta: actualizada.tipo_cuenta ?? '',
            tipo_cuenta: actualizada.tipo_cuenta ?? '',
            idProcContable: actualizada.id_proc_contable ?? null,
            id_proc_contable: actualizada.id_proc_contable ?? null,
            debe: Number(actualizada.debe ?? 0),
            haber: Number(actualizada.haber ?? 0),
        });
    } catch (error) {
        console.error('Error al actualizar cuenta:', error);
        return res.status(500).json({ error: 'Error al actualizar cuenta' });
    }
};

// DELETE /api/contabilidad/plan-cuentas/:id
export const deleteCuenta = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar que no tenga asientos asociados
        const tieneAsientos = await prisma.asiento_detalle.findFirst({
            where: { id_cuenta: Number(id) }
        });
        if (tieneAsientos) {
            return res.status(400).json({ error: 'No se puede eliminar una cuenta que tiene asientos contables' });
        }

        // Verificar que no tenga cuentas hijas
        const tieneHijas = await prisma.plan_cuentas.findFirst({
            where: { cuenta_padre: Number(id) }
        });
        if (tieneHijas) {
            return res.status(400).json({ error: 'No se puede eliminar una cuenta que tiene subcuentas' });
        }

        await prisma.plan_cuentas.delete({
            where: { id_cuenta: Number(id) }
        });

        return res.json({ ok: true, message: 'Cuenta eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        return res.status(500).json({ error: 'Error al eliminar cuenta' });
    }
};

// GET /api/contabilidad/periodos
