import { prisma } from '../../lib/prisma.js';

// GET /api/servicios
export const getServicios = async (req, res) => {
  try {
    const servicios = await prisma.producto.findMany({
      where: {
        OR: [
          { es_servicio: true },
          { producto_servicio: { some: {} } } // Fallback: si tiene registro en producto_servicio, es un servicio
        ]
      },
      include: {
        producto_servicio: true,
        stock: true,
      },
      orderBy: { descripcion: 'asc' }
    });

    const data = servicios.map((p) => {
      const serviceRow = p.producto_servicio?.[0];
      const stockRow = p.stock?.[0];

      return {
        id: p.id_producto,
        nombre: p.descripcion,
        esServicio: true,
        duracion_aprox: serviceRow?.duracion_aprox ?? '—',
        estado: serviceRow?.estado ?? 'Disponible',
        id_producto_servicio: serviceRow?.id_producto_servicio ?? null,
        precio: stockRow?.precio ? Number(stockRow.precio) : 0,
        idStock: stockRow?.id_stock ?? null
      };
    });

    return res.json(data);
  } catch (error) {
    console.error('❌ Error al obtener servicios:', error);
    return res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

// POST /api/servicios
export const createServicio = async (req, res) => {
  const { nombre, precio, duracion_aprox, estado } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear el producto base marcado como servicio
      const producto = await tx.producto.create({
        data: {
          descripcion: nombre,
          es_servicio: true,
        }
      });

      // 2. Crear entrada en stock para el precio
      const stockRow = await tx.stock.create({
        data: {
          id_producto: producto.id_producto,
          cantidad: 0,
          precio: precio ? Number(precio) : 0,
          fecha_modificacion: new Date(),
        }
      });

      // 3. Crear entrada específica en producto_servicio
      const serviceRow = await tx.producto_servicio.create({
        data: {
          id_producto: producto.id_producto,
          duracion_aprox: duracion_aprox || '—',
          estado: estado || 'Disponible',
        }
      });

      return { producto, stockRow, serviceRow };
    });

    return res.status(201).json({
      id: resultado.producto.id_producto,
      nombre: resultado.producto.descripcion,
      precio: precio ? Number(precio) : 0,
      duracion_aprox: resultado.serviceRow.duracion_aprox,
      estado: resultado.serviceRow.estado,
      id_producto_servicio: resultado.serviceRow.id_producto_servicio,
    });
  } catch (error) {
    console.error('❌ Error al crear servicio:', error);
    return res.status(500).json({ error: 'Error interno al crear servicio' });
  }
};

// PUT /api/servicios/:id
export const updateServicio = async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, duracion_aprox, estado, id_producto_servicio } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar producto
      await tx.producto.update({
        where: { id_producto: Number(id) },
        data: { descripcion: nombre }
      });

      // 2. Actualizar precio en stock
      await tx.stock.updateMany({
        where: { id_producto: Number(id) },
        data: {
          precio: precio ? Number(precio) : 0,
          fecha_modificacion: new Date(),
        }
      });

      // 3. Actualizar producto_servicio
      if (id_producto_servicio) {
        await tx.producto_servicio.update({
          where: { id_producto_servicio: Number(id_producto_servicio) },
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
    });

    return res.json({ message: 'Servicio actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar servicio:', error);
    return res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

// DELETE /api/servicios/:id
export const deleteServicio = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      // Eliminar dependencias primero
      await tx.stock.deleteMany({ where: { id_producto: Number(id) } });
      await tx.producto_servicio.deleteMany({ where: { id_producto: Number(id) } });
      await tx.producto.delete({ where: { id_producto: Number(id) } });
    });
    return res.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar servicio:', error);
    return res.status(500).json({ error: 'Error al eliminar servicio' });
  }
};
