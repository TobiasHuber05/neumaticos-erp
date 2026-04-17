import { prisma } from '../lib/prisma.js'; // Importación centralizada

// GET /api/productos
export const getProductos = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        marcas: true, // Relación con el modelo marcas
        stock: true,
      },
      orderBy: { descripcion: 'asc' }
    });

    const data = productos.map((p) => {
      const stockRow = p.stock?.[0];
      return {
        id: p.id_producto,
        nombre: p.descripcion,
        codigo: p.codigo,
        categoria: p.categoria?.nombre ?? '—',
        categoriaId: p.id_categoria,
        marca: p.marcas?.nombre ?? '—',
        marcaId: p.id_marca,
        esServicio: p.es_servicio ?? false,
        stock: stockRow?.cantidad ?? 0,
        min: 10,
        precio: stockRow?.precio ? Number(stockRow.precio) : 0,
        idStock: stockRow?.id_stock ?? null,
      };
    });

    return res.json(data);
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    return res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// GET /api/productos/:id
export const getProductoById = async (req, res) => {
  const { id } = req.params;
  try {
    const p = await prisma.producto.findUnique({
      where: { id_producto: Number(id) },
      include: { categoria: true, marcas: true, stock: true }
    });

    if (!p) return res.status(404).json({ error: 'Producto no encontrado' });

    const stockRow = p.stock?.[0];
    return res.json({
      id: p.id_producto,
      nombre: p.descripcion,
      codigo: p.codigo,
      categoria: p.categoria?.nombre ?? '—',
      categoriaId: p.id_categoria,
      marca: p.marcas?.nombre ?? '—',
      marcaId: p.id_marca,
      esServicio: p.es_servicio ?? false,
      stock: stockRow?.cantidad ?? 0,
      precio: stockRow?.precio ? Number(stockRow.precio) : 0,
      idStock: stockRow?.id_stock ?? null,
    });
  } catch (error) {
    console.error('❌ Error al obtener producto:', error);
    return res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// POST /api/productos
export const createProducto = async (req, res) => {
  const { nombre, codigo, categoriaId, marcaId, esServicio, precio } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear el producto
      const producto = await tx.producto.create({
        data: {
          descripcion: nombre,
          codigo: codigo || null,
          id_categoria: categoriaId ? Number(categoriaId) : null,
          id_marca: marcaId ? Number(marcaId) : null,
          es_servicio: !!esServicio,
        }
      });

      // 2. Crear su entrada inicial en la tabla stock
      const stockRow = await tx.stock.create({
        data: {
          id_producto: producto.id_producto,
          cantidad: 0,
          precio: precio ? Number(precio) : 0,
          fecha_modificacion: new Date(),
        }
      });

      return { producto, stockRow };
    });

    return res.status(201).json({
      id: resultado.producto.id_producto,
      nombre: resultado.producto.descripcion,
      codigo: resultado.producto.codigo,
      categoriaId: resultado.producto.id_categoria,
      marcaId: resultado.producto.id_marca,
      esServicio: resultado.producto.es_servicio,
      stock: 0,
      precio: precio ? Number(precio) : 0,
      idStock: resultado.stockRow.id_stock,
    });
  } catch (error) {
    console.error('❌ Error crítico al crear producto:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Error de relación: La marca o categoría no existen.' });
    }
    return res.status(500).json({ error: 'Error interno del servidor al crear producto' });
  }
};

// PUT /api/productos/:id
export const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, codigo, categoriaId, marcaId, esServicio, precio, idStock } = req.body;

  try {
    const producto = await prisma.producto.update({
      where: { id_producto: Number(id) },
      data: {
        descripcion: nombre,
        codigo: codigo || null,
        id_categoria: categoriaId ? Number(categoriaId) : null,
        id_marca: marcaId ? Number(marcaId) : null,
        es_servicio: !!esServicio,
      }
    });

    if (idStock) {
      await prisma.stock.update({
        where: { id_stock: Number(idStock) },
        data: {
          precio: precio ? Number(precio) : 0,
          fecha_modificacion: new Date(),
        }
      });
    }

    return res.json({ message: 'Producto actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    return res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// GET /api/productos/categorias
export const getCategorias = async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
    return res.json(categorias.map(c => ({ id: c.id_categoria, nombre: c.nombre })));
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// GET /api/productos/marcas
export const getMarcas = async (req, res) => {
  try {
    const marcas = await prisma.marcas.findMany({ 
      orderBy: { nombre: 'asc' } 
    });

    const data = marcas.map(m => ({ 
      id: m.id_marca, 
      nombre: m.nombre 
    }));

    return res.json(data);
  } catch (error) {
    console.error('❌ Error en getMarcas:', error);
    return res.status(500).json({ error: 'Error al obtener marcas' });
  }
};