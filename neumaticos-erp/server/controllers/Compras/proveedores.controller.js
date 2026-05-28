import { prisma } from '../../lib/prisma.js';

// GET /api/proveedores
export const getProveedores = async (req, res) => {
  try {
    const proveedores = await prisma.proveedores.findMany({
      include: {
        proveedor_categorias: {
          include: { categorias_proveedores: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    // Formatear para que el frontend reciba el mismo shape que antes
    const data = proveedores.map((p) => ({
      id: p.id_proveedor,
      nombre: p.nombre,
      ruc: p.ruc,
      direccion: p.direccion,
      telefono: p.telefono,
      categorias: p.proveedor_categorias.map((pc) => pc.categorias_proveedores?.tipo).filter(Boolean)
    }));

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

// GET /api/proveedores/:id
export const getProveedorById = async (req, res) => {
  const { id } = req.params;
  try {
    const proveedor = await prisma.proveedores.findUnique({
      where: { id_proveedor: Number(id) },
      include: {
        proveedor_categorias: {
          include: { categorias_proveedores: true }
        }
      }
    });

    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });

    return res.json({
      id: proveedor.id_proveedor,
      nombre: proveedor.nombre,
      ruc: proveedor.ruc,
      direccion: proveedor.direccion,
      telefono: proveedor.telefono,
      categorias: proveedor.proveedor_categorias.map((pc) => pc.categorias_proveedores?.tipo).filter(Boolean)
    });
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    return res.status(500).json({ error: 'Error al obtener proveedor' });
  }
};

// POST /api/proveedores
export const createProveedor = async (req, res) => {
  const { nombre, ruc, direccion, telefono, categoriaIds } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const proveedor = await prisma.proveedores.create({
      data: {
        nombre,
        ruc,
        direccion,
        telefono,
        // Crear relaciones con categorías si se proporcionan, asegurando que sean números
        proveedor_categorias: categoriaIds?.length
          ? { create: categoriaIds.map((id) => ({ id_categoria: Number(id) })) }
          : undefined
      },
      include: {
        proveedor_categorias: {
          include: { categorias_proveedores: true }
        }
      }
    });

    return res.status(201).json({
      id: proveedor.id_proveedor,
      nombre: proveedor.nombre,
      ruc: proveedor.ruc,
      direccion: proveedor.direccion,
      telefono: proveedor.telefono,
      categorias: proveedor.proveedor_categorias.map((pc) => pc.categorias_proveedores?.tipo).filter(Boolean)
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    return res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

// PUT /api/proveedores/:id
export const updateProveedor = async (req, res) => {
  const { id } = req.params;
  const { nombre, ruc, direccion, telefono, categoriaIds } = req.body;

  try {
    // Actualizar datos básicos y reemplazar categorías
    await prisma.proveedor_categorias.deleteMany({
      where: { id_proveedor: Number(id) }
    });

    const proveedor = await prisma.proveedores.update({
      where: { id_proveedor: Number(id) },
      data: {
        nombre,
        ruc,
        direccion,
        telefono,
        proveedor_categorias: categoriaIds?.length
          ? { create: categoriaIds.map((catId) => ({ id_categoria: Number(catId) })) }
          : undefined
      },
      include: {
        proveedor_categorias: {
          include: { categorias_proveedores: true }
        }
      }
    });

    return res.json({
      id: proveedor.id_proveedor,
      nombre: proveedor.nombre,
      ruc: proveedor.ruc,
      direccion: proveedor.direccion,
      telefono: proveedor.telefono,
      categorias: proveedor.proveedor_categorias.map((pc) => pc.categorias_proveedores?.tipo).filter(Boolean)
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    return res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

// DELETE /api/proveedores/:id
export const deleteProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.proveedor_categorias.deleteMany({
      where: { id_proveedor: Number(id) }
    });
    await prisma.proveedores.delete({
      where: { id_proveedor: Number(id) }
    });
    return res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    return res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};

// GET /api/proveedores/categorias — para el selector del form
export const getCategorias = async (req, res) => {
  try {
    const categorias = await prisma.categorias_proveedores.findMany({
      orderBy: { tipo: 'asc' }
    });
    return res.json(categorias.map((c) => ({ id: c.id_categoria, nombre: c.tipo })));
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return res.status(500).json({ error: 'Error al obtener categorías' });
  }
};