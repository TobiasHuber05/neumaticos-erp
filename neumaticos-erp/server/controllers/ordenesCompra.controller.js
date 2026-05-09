import { prisma } from '../lib/prisma.js';
import { ejecutarAsientoContableCompra } from './asientos.controller.js'; // Asegúrate de que este archivo exista

// GET /api/ordenes-compra
export const getOrdenesCompra = async (req, res) => {
  try {
    const ordenes = await prisma.orden_compra.findMany({
      include: {
        proveedores: true,
        estados: true,
        cotizacion: {
          include: {
            detalle_cotizacion: { where: { seleccionado: true }, include: { producto: true } },
            pedidos_productos: { include: { detalles_pedidos: true } }
          }
        },
      },
      orderBy: { id_orden_compra: 'desc' }
    });

    const data = ordenes.map((oc) => {
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
            detalle_cotizacion: { where: { seleccionado: true }, include: { producto: true } },
            pedidos_productos: { include: { detalles_pedidos: true } }
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

// POST /api/ordenes-compra/:id/factura (CON ASIENTO INTEGRADO)
export const registrarFactura = async (req, res) => {
  const { id } = req.params;
  const { lineas, numero, fecha, timbrado } = req.body;

  if (!lineas || !Array.isArray(lineas) || lineas.length === 0) {
    return res.status(400).json({ error: 'Líneas de factura requeridas' });
  }

  try {
    const oc = await prisma.orden_compra.findUnique({
      where: { id_orden_compra: Number(id) },
      include: {
        cotizacion: {
          include: {
            detalle_cotizacion: { where: { seleccionado: true } },
            pedidos_productos: { include: { detalles_pedidos: true } }
          }
        }
      }
    });

    if (!oc) return res.status(404).json({ error: 'Orden de compra no encontrada' });

    const total = lineas.reduce((acc, l) => acc + Number(l.cantidad || 0) * Number(l.precioUnitario || 0), 0);
    const MAX_MONTO = 999_999_999_999_999.99;
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'El total de la factura debe ser un monto positivo' });
    }
    if (total > MAX_MONTO) {
      return res.status(400).json({ error: 'El total de la factura excede el máximo permitido' });
    }

    const ordenLineas = (oc.cotizacion?.detalle_cotizacion ?? []).map((d) => {
      const detallePedido = oc.cotizacion?.pedidos_productos?.detalles_pedidos?.find((dp) => dp.id_producto === d.id_producto);
      return { productoId: d.id_producto, cantidadPedida: Number(detallePedido?.cantidad ?? 1) };
    });

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Detalle de orden de compra
      for (const linea of lineas) {
        const cantidadPedida = ordenLineas.find((ol) => ol.productoId === Number(linea.productoId))?.cantidadPedida ?? 1;
        await tx.detalle_orden_compra.create({
          data: {
            id_orden_compra: Number(id),
            id_producto: Number(linea.productoId),
            cantidad_pedida: cantidadPedida,
            cantidad_entregada: Number(linea.cantidad || 0),
            precio_unitario: Number(linea.precioUnitario || 0),
            subtotal: Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0),
          }
        });
      }

      // 2. Factura de compra
      const factura = await tx.factura_compra.create({
        data: {
          id_orden_compra: Number(id),
          id_proveedor: oc.id_proveedor,
          fecha_emision: fecha ? new Date(fecha) : new Date(),
          timbrado: timbrado ?? null,
          total,
          contado_credito: true,
        }
      });

      // 3. Detalle de factura
      await Promise.all(lineas.map((linea) =>
        tx.detalle_factura.create({
          data: {
            id_factura_compra: factura.id_factura_compra,
            id_producto: Number(linea.productoId),
            cantidad_recibida: Number(linea.cantidad || 0),
            precio_unitario: Number(linea.precioUnitario || 0),
            subtotal: Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0),
            iva: 0,
          }
        })
      ));

      // 4. Stock
      for (const linea of lineas) {
        const stockExistente = await tx.stock.findFirst({ where: { id_producto: Number(linea.productoId) } });
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

      // --- AQUÍ EL ASIENTO CONTABLE SIN ROMPER LO DEMÁS ---
      await ejecutarAsientoContableCompra(tx, factura);

      // 5. Estado de la OC
      const entregadoPorProducto = {};
      for (const linea of lineas) {
        const pid = Number(linea.productoId);
        entregadoPorProducto[pid] = (entregadoPorProducto[pid] ?? 0) + Number(linea.cantidad || 0);
      }
      const pendienteTotal = ordenLineas.some((ol) => (entregadoPorProducto[ol.productoId] ?? 0) < ol.cantidadPedida);

      if (pendienteTotal) {
        let estadoPendiente = await tx.estados.findFirst({ where: { nombre: { contains: 'Pendiente' } } });
        if (!estadoPendiente) estadoPendiente = await tx.estados.create({ data: { nombre: 'Pendiente entrega' } });
        await tx.orden_compra.update({ where: { id_orden_compra: Number(id) }, data: { id_estado: estadoPendiente.id_estado } });
      } else {
        let estadoCerrada = await tx.estados.findFirst({ where: { nombre: { contains: 'Cerrada' } } });
        if (!estadoCerrada) estadoCerrada = await tx.estados.create({ data: { nombre: 'Cerrada' } });
        await tx.orden_compra.update({ where: { id_orden_compra: Number(id) }, data: { id_estado: estadoCerrada.id_estado } });
      }

      return factura;
    });

    return res.status(201).json({
      ok: true,
      factura: {
        id: resultado.id_factura_compra,
        numero: numero ?? `FAC-P-${String(resultado.id_factura_compra).padStart(4, '0')}`,
        total: Number(resultado.total),
        lineas,
      }
    });
  } catch (error) {
    console.error('Error al registrar factura:', error);
    const msg = error?.message ?? '';
    const code = error?.code;
    if (code === 'P2003' || /Foreign key constraint/i.test(msg)) {
      return res.status(500).json({ error: 'Error de integridad al registrar la factura o el asiento contable' });
    }
    if (/numeric field overflow|22003|value out of range/i.test(msg)) {
      return res.status(400).json({ error: 'Monto demasiado grande para guardar en la base de datos' });
    }
    return res.status(500).json({ error: 'Error al registrar factura' });
  }
};

// GET /api/ordenes-compra/facturas
export const getFacturas = async (req, res) => {
  try {
    const facturas = await prisma.factura_compra.findMany({
      include: { 
        proveedores: true, 
        orden_compra: true, 
        detalle_factura: {
          include: { producto: true }
        }, 
        detalle_orden_pago_facturas: { select: { id_orden_pago: true } } 
      },
      orderBy: { id_factura_compra: 'desc' }
    });
    const data = facturas.map((f) => ({
      id: f.id_factura_compra,
      numero: `FAC-P-${String(f.id_factura_compra).padStart(4, '0')}`,
      timbrado: f.timbrado ?? '—',
      ordenCompraId: f.id_orden_compra ?? null,
      proveedorId: f.id_proveedor,
      fecha: f.fecha_emision?.toISOString().split('T')[0] ?? '—',
      total: Number(f.total ?? 0),
      estado: 'Aceptada',
      estadoPago: f.detalle_orden_pago_facturas.length > 0 ? 'Pagada' : 'Pendiente',
      lineas: (f.detalle_factura ?? []).map((d) => ({
        productoId: d.id_producto,
        nombreProducto: d.producto?.descripcion ?? '—',
        cantidad: Number(d.cantidad_recibida ?? 0),
        precioUnitario: Number(d.precio_unitario ?? 0),
      })),
    }));
    return res.json(data);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    return res.status(500).json({ error: 'Error al obtener facturas' });
  }
};