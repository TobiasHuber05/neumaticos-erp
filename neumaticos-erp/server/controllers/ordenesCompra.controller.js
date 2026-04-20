import { prisma } from '../lib/prisma.js';

// GET /api/ordenes-compra
export const getOrdenesCompra = async (req, res) => {
  try {
    const ordenes = await prisma.orden_compra.findMany({
      include: {
        proveedores: true,
        estados: true,
        cotizacion: {
          include: {
            detalle_cotizacion: {
              where: { seleccionado: true },
              include: { producto: true }
            },
            pedidos_productos: {
              include: {
                detalles_pedidos: true
              }
            }
          }
        },
      },
      orderBy: { id_orden_compra: 'desc' }
    });

    const data = ordenes.map((oc) => {
      const detallesSeleccionados = oc.cotizacion?.detalle_cotizacion ?? [];
      const detallesPedido = oc.cotizacion?.pedidos_productos?.detalles_pedidos ?? [];

      const lineas = detallesSeleccionados.map((d) => {
        // Buscar la cantidad real del pedido para este producto
        const detallePedido = detallesPedido.find(
          (dp) => dp.id_producto === d.id_producto
        );
        return {
          productoId: d.id_producto,
          nombreProducto: d.producto?.descripcion ?? '—',
          cantidadPedida: detallePedido?.cantidad ?? 1,
          precioUnitario: Number(d.precio ?? 0),
        };
      });

      return {
        id: oc.id_orden_compra,
        numero: `OC-${String(oc.id_orden_compra).padStart(4, '0')}`,
        proveedorId: oc.id_proveedor,
        fecha: oc.fecha?.toISOString().split('T')[0] ?? '—',
        estado: oc.estados?.nombre ?? 'Pendiente entrega',
        lineas,
      };
    });

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener órdenes de compra:', error);
    return res.status(500).json({ error: 'Error al obtener órdenes de compra' });
  }
};

// GET /api/ordenes-compra/:id
export const getOrdenCompraById = async (req, res) => {
  const { id } = req.params;
  try {
    const oc = await prisma.orden_compra.findUnique({
      where: { id_orden_compra: Number(id) },
      include: {
        proveedores: true,
        estados: true,
        cotizacion: {
          include: {
            detalle_cotizacion: {
              where: { seleccionado: true },
              include: { producto: true }
            },
            pedidos_productos: {
              include: { detalles_pedidos: true }
            }
          }
        }
      }
    });

    if (!oc) return res.status(404).json({ error: 'Orden de compra no encontrada' });

    const detallesSeleccionados = oc.cotizacion?.detalle_cotizacion ?? [];
    const detallesPedido = oc.cotizacion?.pedidos_productos?.detalles_pedidos ?? [];

    const lineas = detallesSeleccionados.map((d) => {
      const detallePedido = detallesPedido.find((dp) => dp.id_producto === d.id_producto);
      return {
        productoId: d.id_producto,
        nombreProducto: d.producto?.descripcion ?? '—',
        cantidadPedida: detallePedido?.cantidad ?? 1,
        precioUnitario: Number(d.precio ?? 0),
      };
    });

    return res.json({
      id: oc.id_orden_compra,
      numero: `OC-${String(oc.id_orden_compra).padStart(4, '0')}`,
      proveedorId: oc.id_proveedor,
      fecha: oc.fecha?.toISOString().split('T')[0] ?? '—',
      estado: oc.estados?.nombre ?? 'Pendiente entrega',
      lineas,
    });
  } catch (error) {
    console.error('Error al obtener orden de compra:', error);
    return res.status(500).json({ error: 'Error al obtener orden de compra' });
  }
};

// POST /api/ordenes-compra/:id/factura
export const registrarFactura = async (req, res) => {
  const { id } = req.params;
  const { numero, timbrado, fecha, lineas } = req.body;

  if (!lineas?.length) {
    return res.status(400).json({ error: 'La factura debe tener al menos una línea' });
  }

  try {
    const oc = await prisma.orden_compra.findUnique({
      where: { id_orden_compra: Number(id) },
      include: {
        cotizacion: {
          include: {
            detalle_cotizacion: {
              where: { seleccionado: true },
              include: { producto: true }
            },
            pedidos_productos: {
              include: { detalles_pedidos: true }
            }
          }
        }
      }
    });

    if (!oc) return res.status(404).json({ error: 'Orden de compra no encontrada' });

    const total = lineas.reduce(
      (acc, l) => acc + Number(l.cantidad || 0) * Number(l.precioUnitario || 0),
      0
    );

    const ordenLineas = (oc.cotizacion?.detalle_cotizacion ?? []).map((d) => {
      const detallePedido = oc.cotizacion?.pedidos_productos?.detalles_pedidos?.find(
        (dp) => dp.id_producto === d.id_producto
      );
      return {
        productoId: d.id_producto,
        cantidadPedida: Number(detallePedido?.cantidad ?? 1),
      };
    });

    const resultado = await prisma.$transaction(async (tx) => {
      // Crear detalle de orden de compra
      const detalleOC = await tx.detalle_orden_compra.create({
        data: {
          id_orden_compra: Number(id),
          id_producto: Number(lineas[0].productoId),
          subtotal: total,
          cantidad_recibida: lineas.reduce((acc, l) => acc + Number(l.cantidad || 0), 0),
        }
      });

      // Crear factura de compra
      const factura = await tx.factura_compra.create({
        data: {
          id_detalle_compra: detalleOC.id_detalle_compra,
          id_proveedor: oc.id_proveedor,
          fecha_emision: fecha ? new Date(fecha) : new Date(),
          timbrado: timbrado ?? null,
          total,
          contado_credito: true,
        }
      });

      // Guardar líneas de factura
      await Promise.all(lineas.map((linea) =>
        tx.detalle_factura.create({
          data: {
            id_factura_compra: factura.id_factura_compra,
            id_producto: Number(linea.productoId),
            producto_cantidad: Number(linea.cantidad || 0),
            subtotal: Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0),
            iva: 0,
            precio_total: Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0),
          }
        })
      ));

      // Actualizar stock por cada línea
      for (const linea of lineas) {
        const stockExistente = await tx.stock.findFirst({
          where: { id_producto: Number(linea.productoId) }
        });

        if (stockExistente) {
          await tx.stock.update({
            where: { id_stock: stockExistente.id_stock },
            data: {
              cantidad: (stockExistente.cantidad ?? 0) + Number(linea.cantidad || 0),
              fecha_modificacion: new Date(),
            }
          });
        }
      }

      // Verificar si la OC quedó totalmente entregada o sigue pendiente
      const entregasPrevias = await tx.detalle_factura.findMany({
        where: {
          factura_compra: {
            id_factura_compra: { not: factura.id_factura_compra },
            detalle_orden_compra: { id_orden_compra: Number(id) }
          }
        }
      });

      const entregadoPorProducto = {};
      for (const entrega of entregasPrevias) {
        const pid = entrega.id_producto;
        entregadoPorProducto[pid] = (entregadoPorProducto[pid] ?? 0) + Number(entrega.producto_cantidad ?? 0);
      }
      for (const linea of lineas) {
        const pid = Number(linea.productoId);
        entregadoPorProducto[pid] = (entregadoPorProducto[pid] ?? 0) + Number(linea.cantidad || 0);
      }

      const pendienteTotal = ordenLineas.some((ol) => {
        return (entregadoPorProducto[ol.productoId] ?? 0) < ol.cantidadPedida;
      });

      let estadoPendiente = await tx.estados.findFirst({
        where: { nombre: { contains: 'Pendiente' } }
      });
      if (!estadoPendiente) {
        estadoPendiente = await tx.estados.create({
          data: { nombre: 'Pendiente entrega' }
        });
      }

      if (pendienteTotal) {
        await tx.orden_compra.update({
          where: { id_orden_compra: Number(id) },
          data: { id_estado: estadoPendiente.id_estado }
        });
      } else {
        let estadoCerrada = await tx.estados.findFirst({
          where: { nombre: { contains: 'Cerrada' } }
        });
        if (!estadoCerrada) {
          estadoCerrada = await tx.estados.create({
            data: { nombre: 'Cerrada' }
          });
        }
        await tx.orden_compra.update({
          where: { id_orden_compra: Number(id) },
          data: { id_estado: estadoCerrada.id_estado }
        });
      }

      return factura;
    });

    return res.status(201).json({
      ok: true,
      factura: {
        id: resultado.id_factura_compra,
        numero: numero ?? `FAC-P-${String(resultado.id_factura_compra).padStart(4, '0')}`,
        timbrado: resultado.timbrado ?? '—',
        ordenCompraId: Number(id),
        proveedorId: oc.id_proveedor,
        fecha: resultado.fecha_emision?.toISOString().split('T')[0],
        total: Number(resultado.total),
        estado: 'Aceptada',
        estadoPago: 'Pendiente',
        lineas,
      }
    });
  } catch (error) {
    console.error('Error al registrar factura:', error);
    return res.status(500).json({ error: 'Error al registrar factura' });
  }
};

// GET /api/ordenes-compra/facturas
export const getFacturas = async (req, res) => {
  try {
    const facturas = await prisma.factura_compra.findMany({
      include: {
        proveedores: true,
        detalle_orden_compra: {
          include: { orden_compra: true }
        },
        detalle_factura: true,
      },
      orderBy: { id_factura_compra: 'desc' }
    });

    const data = facturas.map((f) => ({
      id: f.id_factura_compra,
      numero: `FAC-P-${String(f.id_factura_compra).padStart(4, '0')}`,
      timbrado: f.timbrado ?? '—',
      ordenCompraId: f.detalle_orden_compra?.id_orden_compra ?? null,
      proveedorId: f.id_proveedor,
      fecha: f.fecha_emision?.toISOString().split('T')[0] ?? '—',
      total: Number(f.total ?? 0),
      estado: 'Aceptada',
      estadoPago: 'Pendiente',
      lineas: (f.detalle_factura ?? []).map((d) => ({
        productoId: d.id_producto,
        cantidad: Number(d.producto_cantidad ?? 0),
        precioUnitario: Number(d.producto_cantidad ?? 0)
          ? Number(d.precio_total ?? 0) / Number(d.producto_cantidad ?? 1)
          : 0,
      })),
    }));

    return res.json(data);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    return res.status(500).json({ error: 'Error al obtener facturas' });
  }
};