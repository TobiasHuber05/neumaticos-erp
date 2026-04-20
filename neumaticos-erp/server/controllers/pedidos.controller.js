import { prisma } from '../lib/prisma.js';

// 1. Obtener todos los pedidos
export const getPedidos = async (req, res) => {
  try {
    const pedidos = await prisma.pedidos_productos.findMany({
      include: {
        detalles_pedidos: {
          include: {
            producto: {
              include: {
                categoria: true  // ← trae el nombre de la categoría
              }
            }
          }
        },
        cotizacion: true
      },
      orderBy: { id_pedido_producto: 'desc' }
    });

    const data = pedidos.map(p => {
      let estado = 'Pendiente Cotización';
      if (p.cotizacion.length > 0) {
        estado = 'En Cotización';
      }

      return {
        id: p.id_pedido_producto,
        idDB: p.id_pedido_producto,
        numero: `PED-${String(p.id_pedido_producto).padStart(4, '0')}`,
        fecha: p.fecha?.toISOString().split('T')[0] ?? '—',
        estado,
        productos: p.detalles_pedidos.length,
        items: p.detalles_pedidos.map(d => ({
          id: d.id_detalle_pedido,
          productoId: d.id_producto,
          nombreProducto: d.producto?.descripcion ?? 'Desconocido',
          categoria: d.producto?.categoria?.nombre ?? '',
          cantidad: d.cantidad
        }))
      };
    });

    res.json(data);
  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// 2. Crear un nuevo pedido
export const createPedido = async (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'El pedido debe tener al menos un ítem.' });
  }

  try {
    const nuevoPedido = await prisma.$transaction(async (tx) => {
      const cabecera = await tx.pedidos_productos.create({
        data: { fecha: new Date() }
      });

      await tx.detalles_pedidos.createMany({
        data: items.map(item => ({
          id_pedido_producto: cabecera.id_pedido_producto,
          id_producto: Number(item.productoId),
          cantidad: Number(item.cantidad)
        }))
      });

      return cabecera;
    });

    res.status(201).json({
      ok: true,
      id: nuevoPedido.id_pedido_producto,
      numero: `PED-${String(nuevoPedido.id_pedido_producto).padStart(4, '0')}`,
      fecha: nuevoPedido.fecha?.toISOString().split('T')[0],
      estado: 'Pendiente Cotización',
      items: [],
      productos: 0,
    });
  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    res.status(500).json({ error: error.message });
  }
};