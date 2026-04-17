import { prisma } from '../lib/prisma.js'; 

// 1. Obtener todos los pedidos
export const getPedidos = async (req, res) => {
  try {
    const pedidos = await prisma.pedidos_productos.findMany({
      include: {
        detalles_pedidos: {
          include: {
            producto: true // Para sacar la descripción del producto
          }
        }
      },
      orderBy: { id_pedido_producto: 'desc' }
    });

    const data = pedidos.map(p => ({
      id: p.id_pedido_producto,
      numero: `PED-${String(p.id_pedido_producto).padStart(4, '0')}`,
      fecha: p.fecha?.toISOString().split('T')[0] ?? '—',
      estado: 'Pendiente Cotización', // Hardcodeado porque tu modelo no tiene campo estado
      items: p.detalles_pedidos.map(d => ({
        id: d.id_detalle_pedido,
        productoId: d.id_producto,
        nombre: d.producto?.descripcion ?? 'Desconocido',
        cantidad: d.cantidad
      }))
    }));

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
      // CREACIÓN DE CABECERA
      // Solo enviamos 'fecha' porque tu modelo no tiene id_usuario ni estado
      const cabecera = await tx.pedidos_productos.create({
        data: {
          fecha: new Date(),
        }
      });

      // CREACIÓN DE DETALLES
      await tx.detalles_pedidos.createMany({
        data: items.map(item => ({
          id_pedido_producto: cabecera.id_pedido_producto,
          id_producto: Number(item.productoId),
          cantidad: Number(item.cantidad)
        }))
      });

      return cabecera;
    });

    res.status(201).json({ ok: true, id: nuevoPedido.id_pedido_producto });
  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    // Enviamos el mensaje de error real para saber si falta algo más
    res.status(500).json({ error: error.message });
  }
};