import { prisma } from '../lib/prisma.js';

// GET /api/cargos
export const getCargos = async (req, res) => {
    try {
        const cargos = await prisma.cargos.findMany({
            orderBy: { id_cargo: 'asc' }
        });
    res.json(cargos);
    } catch (error) {
        console.error('Error al obtener cargos:', error);
        res.status(500).json({ error: 'Error al obtener cargos' });
    }
};

// GET /api/cargos/:id
export const getCargoById = async (req, res) => {
    const { id } = req.params;
    try {
        const cargo = await prisma.cargos.findUnique({
        where: { id_cargo: Number(id) },
        include: { funcionarios: { include: { personas: true } } }
        });
        if (!cargo) return res.status(404).json({ error: 'Cargo no encontrado' });
        res.json(cargo);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cargo' });
    }
};

// POST /api/cargos
export const createCargo = async (req, res) => {
    const { nombre_cargo, descripcion_cargo, area_superior, jefe_inmediato, sueldo_base } = req.body;
    if (!nombre_cargo) return res.status(400).json({ error: 'nombre_cargo es requerido' });
    try {
        const cargo = await prisma.cargos.create({
            data: {
                nombre_cargo,
                descripcion_cargo,
                area_superior,
                jefe_inmediato,
                sueldo_base: sueldo_base ? Number(sueldo_base) : null
            }
        });
        res.status(201).json(cargo);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear cargo' });
    }
};

// PUT /api/cargos/:id
export const updateCargo = async (req, res) => {
    const { id } = req.params;
    const { nombre_cargo, descripcion_cargo, area_superior, jefe_inmediato, sueldo_base } = req.body;
    try {
        const cargo = await prisma.cargos.update({
            where: { id_cargo: Number(id) },
            data: { nombre_cargo, descripcion_cargo, area_superior, jefe_inmediato,
                sueldo_base: sueldo_base ? Number(sueldo_base) : null }
        });
        res.json(cargo);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar cargo' });
    }
};

// DELETE /api/cargos/:id
export const deleteCargo = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.cargos.delete({ where: { id_cargo: Number(id) } });
        res.json({ ok: true, message: 'Cargo eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar cargo (puede tener funcionarios asignados)' });
    }
};