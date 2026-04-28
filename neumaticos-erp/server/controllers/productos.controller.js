import { prisma } from '../lib/prisma.js'; // Importación centralizada

// GET /api/productos
export const getProductos = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        marcas: true,
        stock: true,
        producto_servicio: true,
      },
      orderBy: { descripcion: 'asc' }
    });

    const data = await Promise.all(productos.map(async (p) => {
      const stockRow = p.stock?.[0];
      let serviceRow = p.producto_servicio?.[0];

      // MIGRACIÓN AUTOMÁTICA: Si no tiene registro en producto_servicio, lo creamos (necesario para presupuestos)
      if (!serviceRow) {
        try {
          serviceRow = await prisma.producto_servicio.create({
            data: {
              id_producto: p.id_producto,
              duracion_aprox: p.es_servicio ? '—' : null,
              estado: 'Disponible'
            }
          });
        } catch (err) {
          console.error(`❌ Error al crear registro automático para ${p.descripcion}:`, err);
        }
      }

      return {
        id: p.id_producto,
        nombre: p.descripcion,
        codigo: p.codigo || '',
        categoria: p.categoria?.nombre ?? '—',
        categoriaId: p.id_categoria,
        marca: p.marcas?.nombre ?? '—',
        marcaId: p.id_marca,
        esServicio: !!p.es_servicio,
        stock: stockRow?.cantidad ?? 0,
        min: 10,
        precio: stockRow?.precio ? Number(stockRow.precio) : 0,
        idStock: stockRow?.id_stock ?? null,
        duracion_aprox: serviceRow?.duracion_aprox ?? '—',
        estado: serviceRow?.estado ?? 'Disponible',
        id_producto_servicio: serviceRow?.id_producto_servicio ?? null,
      };
    }));

    return res.json(data);
  } catch (error) {
    console.error('❌ Error en getProductos:', error);
    return res.status(500).json({ error: 'Error en el servidor: ' + error.message });
  }
};

// GET /api/productos/:id
export const getProductoById = async (req, res) => {
  const { id } = req.params;
  try {
    const p = await prisma.producto.findUnique({
      where: { id_producto: Number(id) },
      include: { categoria: true, marcas: true, stock: true, producto_servicio: true }
    });

    if (!p) return res.status(404).json({ error: 'Producto no encontrado' });

    const stockRow = p.stock?.[0];
    const serviceRow = p.producto_servicio?.[0];
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
      duracion_aprox: serviceRow?.duracion_aprox ?? '—',
      estado: serviceRow?.estado ?? 'Disponible',
      id_producto_servicio: serviceRow?.id_producto_servicio ?? null,
    });
  } catch (error) {
    console.error('❌ Error al obtener producto:', error);
    return res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// POST /api/productos
export const createProducto = async (req, res) => {
  // Aceptamos tanto esServicio como es_servicio
  const esServ = req.body.esServicio === true || req.body.es_servicio === true || req.body.es_servicio === 'true';
  const { nombre, codigo, categoriaId, marcaId, precio, duracion_aprox, estado } = req.body;

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
          es_servicio: esServ,
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

      // 3. Crear entrada en producto_servicio (necesario para presupuestos y facturas)
      const serviceRow = await tx.producto_servicio.create({
        data: {
          id_producto: producto.id_producto,
          duracion_aprox: duracion_aprox || (esServ ? '—' : null),
          estado: estado || 'Disponible',
        }
      });

      return { producto, stockRow, serviceRow };
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
      duracion_aprox: resultado.serviceRow?.duracion_aprox ?? '—',
      estado: resultado.serviceRow?.estado ?? 'Disponible',
      id_producto_servicio: resultado.serviceRow?.id_producto_servicio ?? null,
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
  const { nombre, codigo, categoriaId, marcaId, esServicio, precio, idStock, duracion_aprox, estado, id_producto_servicio } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar producto base
      await tx.producto.update({
        where: { id_producto: Number(id) },
        data: {
          descripcion: nombre,
          codigo: codigo || null,
          id_categoria: categoriaId ? Number(categoriaId) : null,
          id_marca: marcaId ? Number(marcaId) : null,
          es_servicio: !!esServicio,
        }
      });

      // 2. Actualizar stock/precio
      if (idStock) {
        await tx.stock.update({
          where: { id_stock: Number(idStock) },
          data: {
            precio: precio ? Number(precio) : 0,
            fecha_modificacion: new Date(),
          }
        });
      }

      // 3. Actualizar metadatos de servicio
      if (esServicio) {
        if (id_producto_servicio) {
          await tx.producto_servicio.update({
            where: { id_producto_servicio: Number(id_producto_servicio) },
            data: {
              duracion_aprox: duracion_aprox || '—',
              estado: estado || 'Disponible',
            }
          });
        } else {
          const existe = await tx.producto_servicio.findFirst({
            where: { id_producto: Number(id) }
          });

          if (existe) {
            await tx.producto_servicio.update({
              where: { id_producto_servicio: existe.id_producto_servicio },
              data: {
                duracion_aprox: duracion_aprox || '—',
                estado: estado || 'Disponible',
              }
            });
          } else {
            await tx.producto_servicio.create({
              data: {
                id_producto: Number(id),
                duracion_aprox: duracion_aprox || '—',
                estado: estado || 'Disponible',
              }
            });
          }
        }
      }
    });

    return res.json({ message: 'Producto actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    return res.status(500).json({ error: 'Error al actualizar producto: ' + error.message });
  }
};

// DELETE /api/productos/:id
export const deleteProducto = async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Intentando eliminar Producto ID: ${id}`);
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar de tablas de metadata (hijas directas)
      await tx.stock.deleteMany({ where: { id_producto: Number(id) } });
      await tx.producto_servicio.deleteMany({ where: { id_producto: Number(id) } });

      // 2. Intentar eliminar el producto
      await tx.producto.delete({ where: { id_producto: Number(id) } });
    });
    return res.json({ message: 'Eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error);

    // Error P2003: Foreign key constraint failed
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'No se puede eliminar: este item está siendo usado en facturas, presupuestos o pedidos.'
      });
    }

    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
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