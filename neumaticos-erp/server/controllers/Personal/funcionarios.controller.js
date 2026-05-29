import { prisma } from '../../lib/prisma.js';


// GET /api/funcionarios
export const getFuncionarios = async (req, res) => {
    try {
        const funcionarios = await prisma.funcionarios.findMany({
            include: {
                personas: true,
                cargos: true,
                familiares: { include: { personas: true } },
                contrato: { include: { sueldos: true } },
                historial: { include: { cargos: true }, orderBy: { fecha_ingreso: 'desc' } }
            },
            orderBy: { id_funcionario: 'asc' }
        });

        const data = funcionarios.map(f => ({
            id: f.id_funcionario,
            persona: f.personas,
            cargo: f.cargos,
            familiares: f.familiares,
            contrato: f.contrato,
            historial: f.historial,
            // Cantidad de hijos menores de 18 (para bonificación familiar)
            hijos_menores: f.familiares.filter(fam => {
                if (fam.parentesco?.toLowerCase() !== 'hijo' &&
                    fam.parentesco?.toLowerCase() !== 'hija') return false;
                if (!fam.fecha_nacimiento) return false;
                const hoy = new Date();
                const nacimiento = new Date(fam.fecha_nacimiento);
                const edad = hoy.getFullYear() - nacimiento.getFullYear();
                return edad < 18;
            }).length
        }));

        res.json(data);
    } catch (error) {
        console.error('Error al obtener funcionarios:', error);
        res.status(500).json({ error: 'Error al obtener funcionarios' });
    }
};

// GET /api/funcionarios/:id
export const getFuncionarioById = async (req, res) => {
    const { id } = req.params;
    try {
        const funcionario = await prisma.funcionarios.findUnique({
            where: { id_funcionario: Number(id) },
            include: {
                personas: true,
                cargos: true,
                familiares: { include: { personas: true } },
                contrato: { include: { sueldos: { include: { conceptos: true } } } },
                historial: { include: { cargos: true }, orderBy: { fecha_ingreso: 'desc' } }
            }
        });
        if (!funcionario) return res.status(404).json({ error: 'Funcionario no encontrado' });
        res.json(funcionario);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener funcionario' });
    }
};

// POST /api/funcionarios  — crea persona + funcionario + contrato en una transacción
export const createFuncionario = async (req, res) => {
    const {
        // datos persona
        nombre, apellido, ci, ruc, estado_civil, fecha_nacimiento, sexo, razon_social,
        // datos funcionario/contrato
        id_cargo, fecha_ingreso, salario_base,
        // familiares (array opcional)
        familiares = []
    } = req.body;

    if (!nombre || !apellido || !ci) {
        return res.status(400).json({ error: 'nombre, apellido y ci son requeridos' });
    }

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Crear persona
            const persona = await tx.personas.create({
                data: {
                    nombre, apellido, ci, ruc, estado_civil, sexo, razon_social,
                    fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
                    tipo_persona: 'FUNCIONARIO'
                }
            });

            // 2. Crear funcionario
            const funcionario = await tx.funcionarios.create({
                data: {
                    id_persona: persona.id_persona,
                    id_cargo: id_cargo ? Number(id_cargo) : null
                }
            });

            // 3. Crear historial de cargo inicial
            if (id_cargo && fecha_ingreso) {
                await tx.historial.create({
                    data: {
                        id_funcionario: funcionario.id_funcionario,
                        id_cargo: Number(id_cargo),
                        fecha_ingreso: new Date(fecha_ingreso)
                    }
                });
            }

            // 4. Crear contrato
            if (id_cargo || salario_base) {
                await tx.contrato.create({
                    data: {
                        id_funcionario: funcionario.id_funcionario,
                        id_cargo: id_cargo ? Number(id_cargo) : null,
                        fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : new Date(),
                        salario_base: salario_base ? Number(salario_base) : null
                    }
                });
            }

            // 5. Crear familiares
            for (const fam of familiares) {
                // Crear persona del familiar
                const personaFam = await tx.personas.create({
                    data: {
                        nombre: fam.nombre || null,
                        ci: fam.cedula || null,
                        fecha_nacimiento: fam.fecha_nacimiento ? new Date(fam.fecha_nacimiento) : null,
                        tipo_persona: 'FAMILIAR'
                    }
                });
                // Crear familiar vinculado
                await tx.familiares.create({
                    data: {
                        id_funcionario: funcionario.id_funcionario,
                        id_persona: personaFam.id_persona,
                        parentesco: fam.parentesco,
                        fecha_nacimiento: fam.fecha_nacimiento ? new Date(fam.fecha_nacimiento) : null,
                    }
                });
            }

            return funcionario;
        });

        res.status(201).json({ ok: true, id: resultado.id_funcionario });
    } catch (error) {
        console.error(' Error al crear funcionario:', error);
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/funcionarios/:id
export const updateFuncionario = async (req, res) => {
    const { id } = req.params;
    const {
        nombre, apellido, ci, ruc, estado_civil, fecha_nacimiento, sexo,
        id_cargo, salario_base, fecha_ingreso
    } = req.body;

    try {
        const funcionario = await prisma.funcionarios.findUnique({
            where: { id_funcionario: Number(id) },
            include: { personas: true, contrato: true }
        });
        if (!funcionario) return res.status(404).json({ error: 'Funcionario no encontrado' });

        await prisma.$transaction(async (tx) => {
            // Actualizar persona
            if (funcionario.id_persona) {
                await tx.personas.update({
                    where: { id_persona: funcionario.id_persona },
                    data: {
                        nombre, apellido, ci, ruc, estado_civil, sexo,
                        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined
                    }
                });
            }

            // Actualizar cargo en funcionario
            if (id_cargo) {
                // Si cambió el cargo, cerrar historial anterior y abrir uno nuevo
                const cargoAnterior = funcionario.id_cargo;
                if (cargoAnterior !== Number(id_cargo)) {
                    // Cerrar historial anterior
                    const historialActivo = await tx.historial.findFirst({
                        where: { id_funcionario: Number(id), fecha_salida: null }
                    });
                    if (historialActivo) {
                        await tx.historial.update({
                            where: { id_historial: historialActivo.id_historial },
                            data: { fecha_salida: new Date() }
                        });
                    }
                    // Nuevo historial
                    await tx.historial.create({
                        data: {
                            id_funcionario: Number(id),
                            id_cargo: Number(id_cargo),
                            fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : new Date()
                        }
                    });
                }

                await tx.funcionarios.update({
                    where: { id_funcionario: Number(id) },
                    data: { id_cargo: Number(id_cargo) }
                });
            }
        });

        res.json({ ok: true, message: 'Funcionario actualizado' });
    } catch (error) {
        console.error(' Error al actualizar funcionario:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/funcionarios/:id
export const deleteFuncionario = async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete: solo cierra el contrato activo
        await prisma.historial.updateMany({
            where: { id_funcionario: Number(id), fecha_salida: null },
            data: { fecha_salida: new Date() }
        });
        res.json({ ok: true, message: 'Funcionario dado de baja' });
    } catch (error) {
        res.status(500).json({ error: 'Error al dar de baja funcionario' });
    }
};

// ─── FAMILIARES ──────────────────────────────────────────────────

// GET /api/funcionarios/:id/familiares
export const getFamiliares = async (req, res) => {
    const { id } = req.params;
    try {
        const familiares = await prisma.familiares.findMany({
            where: { id_funcionario: Number(id) }
        });
        res.json(familiares);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener familiares' });
    }
};

// POST /api/funcionarios/:id/familiares
export const addFamiliar = async (req, res) => {
    const { id } = req.params;
    const { parentesco, fecha_nacimiento, nombre, cedula } = req.body;

    if (!parentesco || !nombre) {
        return res.status(400).json({ error: 'nombre y parentesco son requeridos' });
    }

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Crear persona del familiar
            const persona = await tx.personas.create({
                data: {
                    nombre: nombre,
                    ci: cedula || null,
                    fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
                    tipo_persona: 'FAMILIAR'
                }
            });

            // 2. Crear el familiar vinculado a la persona y al funcionario
            const familiar = await tx.familiares.create({
                data: {
                    id_funcionario: Number(id),
                    id_persona: persona.id_persona,
                    parentesco,
                    fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
                }
            });

            return familiar;
        });

        res.status(201).json(resultado);
    } catch (error) {
        console.error('Error al agregar familiar:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/funcionarios/familiares/:idFamiliar
export const deleteFamiliar = async (req, res) => {
    const { idFamiliar } = req.params;
    try {
        await prisma.familiares.delete({ where: { id_familiar: Number(idFamiliar) } });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar familiar' });
    }
};

// ─── CONCEPTOS EXTRAS POR FUNCIONARIO ────────────────────────────
// Usamos la tabla `conceptos` existente con id_funcionario.
// formula = 'recurrente' → se aplica todos los meses y persiste.
// formula = null         → único uso, se elimina tras liquidar.

// GET /api/funcionarios/:id/conceptos
export const getConceptosFuncionario = async (req, res) => {
    const { id } = req.params;
    try {
        const conceptos = await prisma.conceptos.findMany({
            where: { id_funcionario: Number(id), id_sueldo: null },
            orderBy: { id_concepto: 'asc' }
        });
        res.json(conceptos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener conceptos del funcionario' });
    }
};

// POST /api/funcionarios/:id/conceptos
export const addConceptoFuncionario = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, tipo, monto, afecta_ips, recurrente } = req.body;

    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
    if (!monto || isNaN(Number(monto))) return res.status(400).json({ error: 'monto es requerido y debe ser un número' });

    try {
        const concepto = await prisma.conceptos.create({
            data: {
                id_funcionario: Number(id),
                nombre,
                descripcion: descripcion || null,
                credito: tipo === 'Ingreso' ? Number(monto) : null,
                debito:  tipo === 'Egreso'  ? Number(monto) : null,
                afecta_ips: Boolean(afecta_ips),
                formula: recurrente ? 'recurrente' : null,
            }
        });
        res.status(201).json(concepto);
    } catch (error) {
        console.error('Error al agregar concepto a funcionario:', error);
        res.status(500).json({ error: 'Error al agregar concepto' });
    }
};

// DELETE /api/funcionarios/conceptos/:idConcepto
export const deleteConceptoFuncionario = async (req, res) => {
    const { idConcepto } = req.params;
    try {
        await prisma.conceptos.delete({ where: { id_concepto: Number(idConcepto) } });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar concepto' });
    }
};