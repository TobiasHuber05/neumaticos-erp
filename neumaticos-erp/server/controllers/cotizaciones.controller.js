import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── GET /api/cotizaciones ────────────────────────────────────
export const getCotizaciones = async (req, res) => {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: {
        proveedores: true,
        pedidos_productos: {
          include: { detalles_pedidos: { include: { producto: true } } }
        },
        detalle_cotizacion: { include: { producto: true } },
        orden_compra: true,
      },
      orderBy: { id_cotizacion: 'desc' }
    });

    const data = cotizaciones.map((c) => ({
      id: c.id_cotizacion,
      idPedidoProducto: c.id_pedido_producto,
      fecha: c.fecha,
      proveedor: {
        id: c.proveedores?.id_proveedor,
        nombre: c.proveedores?.nombre,
      },
      estado: c.orden_compra.length > 0 ? 'Adjudicado' : 'Pendiente',
      lineas: c.detalle_cotizacion.map((d) => ({
        id: d.id_detalle_cotizacion,
        productoId: d.id_producto,
        nombreProducto: d.producto?.descripcion,
        precio: d.precio,
        seleccionado: d.seleccionado ?? false,
      })),
    }));

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    return res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
};

// ─── GET /api/cotizaciones/pedido/:idPedido ───────────────────
export const getCotizacionesPorPedido = async (req, res) => {
  const { idPedido } = req.params;
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      where: { id_pedido_producto: Number(idPedido) },
      include: {
        proveedores: true,
        detalle_cotizacion: { include: { producto: true } },
        orden_compra: true,
      }
    });

    const data = cotizaciones.map((c) => ({
      id: c.id_cotizacion,
      idPedidoProducto: c.id_pedido_producto,
      fecha: c.fecha,
      proveedorId: c.id_proveedor,
      nombreProveedor: c.proveedores?.nombre,
      estado: c.orden_compra.length > 0 ? 'Adjudicado' : 'Pendiente',
      lineas: c.detalle_cotizacion.map((d) => ({
        id: d.id_detalle_cotizacion,
        productoId: d.id_producto,
        nombreProducto: d.producto?.descripcion,
        precio: d.precio,
        seleccionado: d.seleccionado ?? false,
      })),
    }));

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener cotizaciones por pedido:', error);
    return res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
};

// ─── POST /api/cotizaciones/generar ──────────────────────────
export const generarCotizaciones = async (req, res) => {
  const { idPedidoProducto, proveedorIds } = req.body;

  if (!idPedidoProducto || !proveedorIds?.length) {
    return res.status(400).json({ error: 'Se requiere idPedidoProducto y al menos un proveedor' });
  }

  try {
    const pedido = await prisma.pedidos_productos.findUnique({
      where: { id_pedido_producto: Number(idPedidoProducto) },
      include: { detalles_pedidos: { include: { producto: true } } }
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (!pedido.detalles_pedidos.length) return res.status(400).json({ error: 'El pedido no tiene productos' });

    const existentes = await prisma.cotizacion.findMany({
      where: { id_pedido_producto: Number(idPedidoProducto) }
    });
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Ya existen cotizaciones generadas para este pedido' });
    }

    const hoy = new Date();

    const cotizaciones = await prisma.$transaction(
      proveedorIds.map((provId) =>
        prisma.cotizacion.create({
          data: {
            id_pedido_producto: Number(idPedidoProducto),
            id_proveedor: Number(provId),
            fecha: hoy,
            detalle_cotizacion: {
              create: pedido.detalles_pedidos.map((det) => ({
                id_producto: det.id_producto,
                precio: null,
                seleccionado: false,
              }))
            }
          },
          include: {
            proveedores: true,
            detalle_cotizacion: { include: { producto: true } },
          }
        })
      )
    );

    const data = cotizaciones.map((c) => ({
      id: c.id_cotizacion,
      idPedidoProducto: c.id_pedido_producto,
      fecha: c.fecha,
      proveedorId: c.id_proveedor,
      nombreProveedor: c.proveedores?.nombre,
      estado: 'Pendiente',
      lineas: c.detalle_cotizacion.map((d) => ({
        id: d.id_detalle_cotizacion,
        productoId: d.id_producto,
        nombreProducto: d.producto?.descripcion,
        precio: d.precio,
        seleccionado: false,
      })),
    }));

    return res.status(201).json({ ok: true, cotizaciones: data });
  } catch (error) {
    console.error('Error al generar cotizaciones:', error);
    return res.status(500).json({ error: 'Error al generar cotizaciones' });
  }
};

// ─── PUT /api/cotizaciones/:id/precios ───────────────────────
export const actualizarPrecios = async (req, res) => {
  const { id } = req.params;
  const { lineas, fechaRespuesta } = req.body;

  if (!lineas?.length) {
    return res.status(400).json({ error: 'Se requieren las líneas con precios' });
  }

  try {
    await prisma.$transaction(
      lineas.map((l) =>
        prisma.detalle_cotizacion.update({
          where: { id_detalle_cotizacion: Number(l.id) },
          data: { precio: l.precio !== '' && l.precio != null ? Number(l.precio) : null }
        })
      )
    );

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id_cotizacion: Number(id) },
      include: {
        proveedores: true,
        detalle_cotizacion: { include: { producto: true } },
      }
    });

    return res.json({
      ok: true,
      cotizacion: {
        id: cotizacion.id_cotizacion,
        proveedorId: cotizacion.id_proveedor,
        nombreProveedor: cotizacion.proveedores?.nombre,
        fechaRespuesta: fechaRespuesta ?? null,
        lineas: cotizacion.detalle_cotizacion.map((d) => ({
          id: d.id_detalle_cotizacion,
          productoId: d.id_producto,
          nombreProducto: d.producto?.descripcion,
          precio: d.precio,
          seleccionado: d.seleccionado,
        })),
      }
    });
  } catch (error) {
    console.error('Error al actualizar precios:', error);
    return res.status(500).json({ error: 'Error al actualizar precios' });
  }
};

// ─── POST /api/cotizaciones/adjudicar ────────────────────────
// Selecciona menor precio por producto Y crea las órdenes de compra
export const adjudicar = async (req, res) => {
  const { idPedidoProducto } = req.body;

  if (!idPedidoProducto) {
    return res.status(400).json({ error: 'Se requiere idPedidoProducto' });
  }

  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      where: { id_pedido_producto: Number(idPedidoProducto) },
      include: {
        detalle_cotizacion: { include: { producto: true } },
        proveedores: true
      }
    });

    if (!cotizaciones.length) {
      return res.status(404).json({ error: 'No hay cotizaciones para este pedido' });
    }

    // Verificar si ya fue adjudicado
    const yaAdjudicado = await prisma.orden_compra.findFirst({
      where: { id_cotizacion: { in: cotizaciones.map(c => c.id_cotizacion) } }
    });
    if (yaAdjudicado) {
      return res.status(409).json({ error: 'Este pedido ya fue adjudicado' });
    }

    // Agrupar todos los detalles por producto
    const todosDetalles = cotizaciones.flatMap((c) =>
      c.detalle_cotizacion
        .filter((d) => d.precio != null && d.precio > 0)
        .map((d) => ({
          ...d,
          proveedorId: c.id_proveedor,
          cotizacionId: c.id_cotizacion,
          nombreProveedor: c.proveedores?.nombre,
        }))
    );

    if (!todosDetalles.length) {
      return res.status(400).json({ error: 'No hay precios cargados en ninguna cotización' });
    }

    // Por cada producto, encontrar el menor precio
    const productoIds = [...new Set(todosDetalles.map((d) => d.id_producto))];
    const ganadores = productoIds.map((prodId) => {
      const candidatos = todosDetalles.filter((d) => d.id_producto === prodId);
      return candidatos.reduce((min, d) => (Number(d.precio) < Number(min.precio) ? d : min));
    });

    const ganadorIds = new Set(ganadores.map((g) => g.id_detalle_cotizacion));

    // Obtener estado "Pendiente entrega"
    let estadoPendiente = await prisma.estados.findFirst({
      where: { nombre: { contains: 'Pendiente' } }
    });

    // Si no existe el estado, crearlo
    if (!estadoPendiente) {
      estadoPendiente = await prisma.estados.create({
        data: { nombre: 'Pendiente entrega' }
      });
    }

    // Agrupar ganadores por proveedor para crear una OC por proveedor
    const porProveedor = {};
    for (const g of ganadores) {
      if (!porProveedor[g.cotizacionId]) {
        porProveedor[g.cotizacionId] = {
          cotizacionId: g.cotizacionId,
          proveedorId: g.proveedorId,
          nombreProveedor: g.nombreProveedor,
          productos: [],
        };
      }
      porProveedor[g.cotizacionId].productos.push(g);
    }

    // Ejecutar todo en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Marcar seleccionado en detalles
      await Promise.all(
        todosDetalles.map((d) =>
          tx.detalle_cotizacion.update({
            where: { id_detalle_cotizacion: d.id_detalle_cotizacion },
            data: { seleccionado: ganadorIds.has(d.id_detalle_cotizacion) }
          })
        )
      );

      // Crear una orden de compra por proveedor ganador
      const ordenes = [];
      for (const grupo of Object.values(porProveedor)) {
        const oc = await tx.orden_compra.create({
          data: {
            id_cotizacion: grupo.cotizacionId,
            id_proveedor: grupo.proveedorId,
            fecha: new Date(),
            id_estado: estadoPendiente.id_estado,
          }
        });
        ordenes.push({
          id: oc.id_orden_compra,
          proveedorId: grupo.proveedorId,
          nombreProveedor: grupo.nombreProveedor,
        });
      }

      return ordenes;
    });

    return res.json({
      ok: true,
      adjudicaciones: ganadores.map((g) => ({
        productoId: g.id_producto,
        nombreProducto: g.producto?.descripcion,
        precio: g.precio,
        proveedorId: g.proveedorId,
        nombreProveedor: g.nombreProveedor,
        cotizacionId: g.cotizacionId,
      })),
      ordenes: resultado,
    });
  } catch (error) {
    console.error('Error al adjudicar:', error);
    return res.status(500).json({ error: 'Error al adjudicar cotizaciones' });
  }
};