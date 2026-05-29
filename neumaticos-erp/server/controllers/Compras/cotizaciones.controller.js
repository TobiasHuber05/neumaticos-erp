import { prisma } from '../../lib/prisma.js';

const MIN_PROVEEDORES_COTIZACION = 3;

const normalizarCategoria = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const categoriasCompatibles = (categoriaProveedor, categoriaPedido) => {
  const proveedor = normalizarCategoria(categoriaProveedor);
  const pedido = normalizarCategoria(categoriaPedido);
  if (!proveedor || !pedido) return false;
  return proveedor === pedido || proveedor.includes(pedido) || pedido.includes(proveedor);
};

const mapCotizacion = (c) => {
  const tienePrecios = c.detalle_cotizacion?.some((d) => d.precio != null && Number(d.precio) > 0);
  let estado = 'Pendiente';
  if (c.orden_compra?.length > 0) estado = 'Adjudicado';
  else if (tienePrecios) estado = 'Respondido';

  return {
    id: c.id_cotizacion,
    idPedidoProducto: c.id_pedido_producto,
    fecha: c.fecha,
    proveedor: {
      id: c.proveedores?.id_proveedor || c.id_proveedor,
      nombre: c.proveedores?.nombre || 'Proveedor desconocido',
    },
    proveedorId: c.id_proveedor,
    nombreProveedor: c.proveedores?.nombre,
    estado,
    lineas: c.detalle_cotizacion.map((d) => {
      const detPedido = c.pedidos_productos?.detalles_pedidos?.find(
        (dp) => Number(dp.id_producto) === Number(d.id_producto),
      );

      return {
        id: d.id_detalle_cotizacion,
        productoId: d.id_producto,
        nombreProducto: d.producto?.descripcion || '—',
        cantidadSolicitada: detPedido ? Number(detPedido.cantidad) : 1,
        precio: d.precio,
        seleccionado: d.seleccionado ?? false,
      };
    }),
  };
};

export const getCotizaciones = async (req, res) => {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: {
        proveedores: true,
        pedidos_productos: { include: { detalles_pedidos: true } },
        detalle_cotizacion: { include: { producto: true } },
        orden_compra: true,
      },
      orderBy: { id_cotizacion: 'desc' },
    });

    return res.json(cotizaciones.map(mapCotizacion));
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    return res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
};

export const getCotizacionesPorPedido = async (req, res) => {
  const { idPedido } = req.params;
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      where: { id_pedido_producto: Number(idPedido) },
      include: {
        proveedores: true,
        pedidos_productos: { include: { detalles_pedidos: true } },
        detalle_cotizacion: { include: { producto: true } },
        orden_compra: true,
      },
    });

    return res.json(cotizaciones.map(mapCotizacion));
  } catch (error) {
    console.error('Error al obtener cotizaciones por pedido:', error);
    return res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
};

export const generarCotizaciones = async (req, res) => {
  const { idPedidoProducto, proveedorIds } = req.body;

  const proveedoresSeleccionados = [...new Set((proveedorIds ?? []).map(Number).filter(Boolean))];

  if (!idPedidoProducto || !proveedoresSeleccionados.length) {
    return res.status(400).json({ error: 'Se requiere idPedidoProducto y al menos tres proveedores' });
  }

  if (proveedoresSeleccionados.length < MIN_PROVEEDORES_COTIZACION) {
    return res.status(400).json({
      error: `El pedido de cotización debe enviarse a al menos ${MIN_PROVEEDORES_COTIZACION} proveedores.`,
    });
  }

  try {
    const pedido = await prisma.pedidos_productos.findUnique({
      where: { id_pedido_producto: Number(idPedidoProducto) },
      include: {
        detalles_pedidos: {
          include: {
            producto: { include: { categoria: true } },
          },
        },
      },
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    const categoriasPedido = pedido.detalles_pedidos
      .map((det) => ({
        id: det.producto?.id_categoria,
        nombre: det.producto?.categoria?.nombre,
      }))
      .filter((cat) => cat.id || cat.nombre);

    if (!categoriasPedido.length) {
      return res.status(400).json({
        error: 'Los productos del pedido deben tener categoría para generar cotizaciones.',
      });
    }

    const proveedores = await prisma.proveedores.findMany({
      where: { id_proveedor: { in: proveedoresSeleccionados } },
      include: {
        proveedor_categorias: {
          include: { categorias_proveedores: true },
        },
      },
    });

    if (proveedores.length !== proveedoresSeleccionados.length) {
      return res.status(400).json({ error: 'Uno o más proveedores seleccionados no existen.' });
    }

    const proveedoresSinCategoria = proveedores.filter((proveedor) => {
      const categoriasProveedor = proveedor.proveedor_categorias ?? [];
      return !categoriasProveedor.some((pc) =>
        categoriasPedido.some((cat) => {
          const mismoNombre = categoriasCompatibles(pc.categorias_proveedores?.tipo, cat.nombre);
          const mismaDescripcion = categoriasCompatibles(pc.categorias_proveedores?.descripcion, cat.nombre);
          return mismoNombre || mismaDescripcion;
        }),
      );
    });

    if (proveedoresSinCategoria.length) {
      return res.status(400).json({
        error: `Proveedor(es) sin categoría compatible: ${proveedoresSinCategoria
          .map((p) => p.nombre)
          .join(', ')}`,
      });
    }

    const existentes = await prisma.cotizacion.findMany({
      where: { id_pedido_producto: Number(idPedidoProducto) },
    });
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Ya existen cotizaciones generadas para este pedido' });
    }

    const hoy = new Date();
    const preciosHistoricos = await Promise.all(
      proveedoresSeleccionados.map(async (provId) => {
        const precios = {};
        await Promise.all(
          pedido.detalles_pedidos.map(async (det) => {
            const mejor = await prisma.detalle_cotizacion.findFirst({
              where: {
                id_producto: det.id_producto,
                cotizacion: { id_proveedor: Number(provId) },
                precio: { not: null },
              },
              orderBy: { precio: 'asc' },
              select: { precio: true },
            });
            precios[det.id_producto] = mejor?.precio ?? null;
          }),
        );
        return { provId, precios };
      }),
    );

    const cotizaciones = await prisma.$transaction(
      proveedoresSeleccionados.map((provId) => {
        const historico = preciosHistoricos.find((p) => p.provId === provId)?.precios ?? {};
        return prisma.cotizacion.create({
          data: {
            id_pedido_producto: Number(idPedidoProducto),
            id_proveedor: Number(provId),
            fecha: hoy,
            detalle_cotizacion: {
              create: pedido.detalles_pedidos.map((det) => ({
                id_producto: det.id_producto,
                precio: historico[det.id_producto] ?? null,
                seleccionado: false,
              })),
            },
          },
          include: {
            proveedores: true,
            pedidos_productos: { include: { detalles_pedidos: true } },
            detalle_cotizacion: { include: { producto: true } },
            orden_compra: true,
          },
        });
      }),
    );

    return res.status(201).json({ ok: true, cotizaciones: cotizaciones.map(mapCotizacion) });
  } catch (error) {
    console.error('Error al generar cotizaciones:', error);
    return res.status(500).json({ error: 'Error al generar cotizaciones' });
  }
};

export const actualizarPrecios = async (req, res) => {
  const { id } = req.params;
  const { lineas, fechaRespuesta } = req.body;

  try {
    await prisma.$transaction(
      lineas.map((l) =>
        prisma.detalle_cotizacion.update({
          where: { id_detalle_cotizacion: Number(l.id) },
          data: { precio: l.precio !== '' && l.precio != null ? Number(l.precio) : null },
        }),
      ),
    );

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id_cotizacion: Number(id) },
      include: {
        proveedores: true,
        pedidos_productos: { include: { detalles_pedidos: true } },
        detalle_cotizacion: { include: { producto: true } },
        orden_compra: true,
      },
    });

    return res.json({ ok: true, cotizacion: mapCotizacion(cotizacion) });
  } catch (error) {
    console.error('Error al actualizar precios:', error);
    return res.status(500).json({ error: 'Error al actualizar precios' });
  }
};

export const adjudicar = async (req, res) => {
  const { idPedidoProducto } = req.body;

  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      where: { id_pedido_producto: Number(idPedidoProducto) },
      include: {
        pedidos_productos: { include: { detalles_pedidos: true } },
        detalle_cotizacion: { include: { producto: true } },
        proveedores: true,
        orden_compra: true,
      },
    });

    if (!cotizaciones.length) {
      return res.status(404).json({ error: 'No hay cotizaciones para este pedido' });
    }

    const yaAdjudicado = cotizaciones.some((c) => c.orden_compra?.length > 0);
    if (yaAdjudicado) {
      return res.status(409).json({ error: 'Este pedido ya fue adjudicado. No se puede adjudicar nuevamente.' });
    }

    const cotizacionesMapeadas = cotizaciones.map(mapCotizacion);

    const todosDetalles = cotizacionesMapeadas.flatMap((c) =>
      c.lineas
        .filter((l) => l.precio != null && l.precio > 0)
        .map((l) => ({
          ...l,
          proveedorId: c.proveedorId,
          cotizacionId: c.id,
          nombreProveedor: c.nombreProveedor,
        })),
    );

    if (!todosDetalles.length) {
      return res.status(400).json({ error: 'No hay precios cargados en ninguna cotización' });
    }

    const productoIds = [...new Set(todosDetalles.map((d) => d.productoId))];
    const ganadores = productoIds.map((prodId) => {
      const candidatos = todosDetalles.filter((d) => d.productoId === prodId);
      return candidatos.reduce((min, d) => (Number(d.precio) < Number(min.precio) ? d : min));
    });

    const ganadorIds = new Set(ganadores.map((g) => g.id));

    let estadoPendiente = await prisma.estados.findFirst({
      where: { nombre: { contains: 'Pendiente' } },
    });

    if (!estadoPendiente) {
      estadoPendiente = await prisma.estados.create({
        data: { nombre: 'Pendiente entrega' },
      });
    }

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

    const resultado = await prisma.$transaction(async (tx) => {
      await Promise.all(
        todosDetalles.map((d) =>
          tx.detalle_cotizacion.update({
            where: { id_detalle_cotizacion: d.id },
            data: { seleccionado: ganadorIds.has(d.id) },
          }),
        ),
      );

      const ordenesCreated = [];
      for (const grupo of Object.values(porProveedor)) {
        const oc = await tx.orden_compra.create({
          data: {
            id_cotizacion: grupo.cotizacionId,
            id_proveedor: grupo.proveedorId,
            fecha: new Date(),
            id_estado: estadoPendiente.id_estado,
          },
        });
        ordenesCreated.push({
          id: oc.id_orden_compra,
          proveedorId: grupo.proveedorId,
          nombreProveedor: grupo.nombreProveedor,
        });
      }

      return ordenesCreated;
    });

    return res.json({ ok: true, adjudicaciones: ganadores, ordenes: resultado });
  } catch (error) {
    console.error('Error al adjudicar:', error);
    return res.status(500).json({ error: 'Error al adjudicar cotizaciones' });
  }
};
