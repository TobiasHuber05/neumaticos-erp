import { prisma } from '../../lib/prisma.js';
import { ejecutarAsientoContableCompra, ejecutarAsientoNotaCreditoCompra } from '../Contabilidad/asientos.controller.js';

function buildLineasOC(oc) {
  const detallesSeleccionados = oc.cotizacion?.detalle_cotizacion ?? [];
  const detallesPedido = oc.cotizacion?.pedidos_productos?.detalles_pedidos ?? [];
  return detallesSeleccionados.map((d) => {
    const detallePedido = detallesPedido.find((dp) => dp.id_producto === d.id_producto);
    return {
      productoId: d.id_producto,
      nombreProducto: d.producto?.descripcion ?? '—',
      cantidadPedida: detallePedido?.cantidad ?? 1,
      precioUnitario: Number(d.precio ?? 0),
    };
  });
}

function computeEstadoOC(oc, lineas) {
  const facturada = {};
  for (const f of oc.factura_compra ?? []) {
    for (const d of f.detalle_factura ?? []) {
      facturada[d.id_producto] = (facturada[d.id_producto] ?? 0) + Number(d.cantidad_recibida ?? 0);
    }
  }
  const pendiente = lineas.some((l) => {
    const pedida = Number(l.cantidadPedida);
    return pedida > (facturada[l.productoId] ?? 0);
  });
  return pendiente ? 'Pendiente entrega' : 'Cerrada';
}

function mapOrdenCompra(oc) {
  const lineas = buildLineasOC(oc);
  return {
    id: oc.id_orden_compra,
    numero: `OC-${String(oc.id_orden_compra).padStart(4, '0')}`,
    proveedorId: oc.id_proveedor,
    fecha: oc.fecha?.toISOString().split('T')[0] ?? '—',
    estado: computeEstadoOC(oc, lineas),
    lineas,
  };
}

// GET /api/ordenes-compra
export const getOrdenesCompra = async (req, res) => {
  try {
    const ordenes = await prisma.orden_compra.findMany({
      include: {
        proveedores: true,
        estados: true,
        factura_compra: { include: { detalle_factura: true } },
        cotizacion: {
          include: {
            detalle_cotizacion: { where: { seleccionado: true }, include: { producto: true } },
            pedidos_productos: { include: { detalles_pedidos: true } },
          },
        },
      },
      orderBy: { id_orden_compra: 'desc' },
    });

    return res.json(ordenes.map(mapOrdenCompra));
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
        factura_compra: { include: { detalle_factura: true } },
        cotizacion: {
          include: {
            detalle_cotizacion: { where: { seleccionado: true }, include: { producto: true } },
            pedidos_productos: { include: { detalles_pedidos: true } },
          },
        },
      },
    });
    if (!oc) return res.status(404).json({ error: 'Orden de compra no encontrada' });
    return res.json(mapOrdenCompra(oc));
  } catch (error) {
    console.error('Error al obtener orden de compra:', error);
    return res.status(500).json({ error: 'Error al obtener orden de compra' });
  }
};

function validarFacturaServidor(ordenLineas, lineas, facturasExistentes) {
  const yaFacturado = {};
  for (const linea of ordenLineas) {
    yaFacturado[linea.productoId] = 0;
  }
  for (const f of facturasExistentes) {
    for (const d of f.detalle_factura ?? []) {
      yaFacturado[d.id_producto] = (yaFacturado[d.id_producto] ?? 0) + Number(d.cantidad_recibida ?? 0);
    }
  }

  const errores = [];
  for (const fl of lineas) {
    const pid = Number(fl.productoId);
    const ocLinea = ordenLineas.find((l) => l.productoId === pid);
    if (!ocLinea) {
      errores.push(`Producto ${pid} no está en la orden de compra.`);
      continue;
    }
    const pedida = Number(ocLinea.cantidadPedida);
    const recibidaAntes = yaFacturado[pid] ?? 0;
    const enFactura = Number(fl.cantidad ?? 0);
    if (enFactura + recibidaAntes > pedida) {
      errores.push(
        `${ocLinea.nombreProducto}: no puede entregarse más de lo pedido (pedido ${pedida}, ya facturado ${recibidaAntes}, esta factura ${enFactura}).`,
      );
    }
    if (enFactura <= 0) {
      errores.push(`${ocLinea.nombreProducto}: la cantidad debe ser mayor a cero.`);
    }
  }
  if (lineas.length === 0) {
    errores.push('La factura debe incluir al menos una línea con cantidad.');
  }
  return errores;
}

async function validarDevolucionServidor(tx, facturaId, lineas) {
  const factura = await tx.factura_compra.findUnique({
    where: { id_factura_compra: Number(facturaId) },
    include: {
      detalle_factura: { include: { producto: true } },
      pedido_devolucion: {
        include: { nota_credito_detalle: true },
      },
    },
  });

  if (!factura) {
    return { factura: null, errores: ['Factura de compra no encontrada.'] };
  }

  const yaDevuelto = {};
  for (const devolucion of factura.pedido_devolucion ?? []) {
    for (const detalle of devolucion.nota_credito_detalle ?? []) {
      const productoId = Number(detalle.id_producto);
      yaDevuelto[productoId] = (yaDevuelto[productoId] ?? 0) + Number(detalle.producto_cantidad ?? 0);
    }
  }

  const errores = [];
  if (!lineas?.length) {
    errores.push('La devolución debe incluir al menos una línea.');
  }

  for (const item of lineas ?? []) {
    const productoId = Number(item.productoId);
    const cantidad = Number(item.cantidad ?? 0);
    const detFactura = factura.detalle_factura.find((d) => Number(d.id_producto) === productoId);

    if (!detFactura) {
      errores.push(`Producto ${productoId} no pertenece a la factura seleccionada.`);
      continue;
    }

    if (cantidad <= 0) {
      errores.push(`${detFactura.producto?.descripcion ?? `Producto ${productoId}`}: la cantidad debe ser mayor a cero.`);
      continue;
    }

    const recibida = Number(detFactura.cantidad_recibida ?? 0);
    const devueltaAntes = yaDevuelto[productoId] ?? 0;
    const disponibleDevolucion = recibida - devueltaAntes;

    if (cantidad > disponibleDevolucion) {
      errores.push(
        `${detFactura.producto?.descripcion ?? `Producto ${productoId}`}: no puede devolverse más de lo recibido (recibido ${recibida}, ya devuelto ${devueltaAntes}, esta devolución ${cantidad}).`,
      );
    }

    const stock = await tx.stock.findFirst({ where: { id_producto: productoId } });
    if (!stock || Number(stock.cantidad ?? 0) < cantidad) {
      errores.push(
        `${detFactura.producto?.descripcion ?? `Producto ${productoId}`}: stock insuficiente para devolver. Disponible ${Number(stock?.cantidad ?? 0)}.`,
      );
    }
  }

  return { factura, errores };
}

// POST /api/ordenes-compra/:id/factura
export const registrarFactura = async (req, res) => {
  const { id } = req.params;
  const { lineas, numero, fecha, timbrado } = req.body;

  try {
    const oc = await prisma.orden_compra.findUnique({
      where: { id_orden_compra: Number(id) },
      include: {
        cotizacion: {
          include: {
            detalle_cotizacion: { where: { seleccionado: true }, include: { producto: true } },
            pedidos_productos: { include: { detalles_pedidos: true } },
          },
        },
      },
    });

    if (!oc) return res.status(404).json({ error: 'Orden de compra no encontrada' });

    const ordenLineas = buildLineasOC(oc);
    const facturasExistentes = await prisma.factura_compra.findMany({
      where: { id_orden_compra: Number(id) },
      include: { detalle_factura: true },
    });

    const errores = validarFacturaServidor(ordenLineas, lineas ?? [], facturasExistentes);
    if (errores.length) {
      return res.status(400).json({ error: errores[0], errores });
    }

    const total = lineas.reduce((acc, l) => acc + Number(l.cantidad || 0) * Number(l.precioUnitario || 0), 0);

    const resultado = await prisma.$transaction(async (tx) => {
      for (const linea of lineas) {
        await tx.detalle_orden_compra.create({
          data: {
            id_orden_compra: Number(id),
            id_producto: Number(linea.productoId),
            id_detalle_compra: undefined, // Evitamos alterar autoincrementales si existieran explícitos
            cantidad_pedida: Number(linea.cantidadPedida || ordenLineas.find((l) => l.productoId === Number(linea.productoId))?.cantidadPedida || 1),
            cantidad_entregada: Number(linea.cantidad || 0),
            precio_unitario: Number(linea.precioUnitario || 0),
            subtotal: Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0),
          },
        });
      }

      const factura = await tx.factura_compra.create({
        data: {
          orden_compra: { connect: { id_orden_compra: Number(id) } },
          proveedores: { connect: { id_proveedor: oc.id_proveedor } },
          fecha_emision: fecha ? new Date(fecha) : new Date(),
          timbrado: timbrado ?? null,
          nro_factura: numero ?? null,
          total,
          contado_credito: true,
        },
      });

      await Promise.all(
        lineas.map((linea) =>
          tx.detalle_factura.create({
            data: {
              id_factura_compra: factura.id_factura_compra,
              id_producto: Number(linea.productoId),
              cantidad_recibida: Number(linea.cantidad || 0),
              precio_unitario: Number(linea.precioUnitario || 0),
              subtotal: Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0),
              iva: 0,
            },
          }),
        ),
      );

      for (const linea of lineas) {
        const stockExistente = await tx.stock.findFirst({ where: { id_producto: Number(linea.productoId) } });
        if (stockExistente) {
          await tx.stock.update({
            where: { id_stock: stockExistente.id_stock },
            data: {
              cantidad: (stockExistente.cantidad ?? 0) + Number(linea.cantidad || 0),
              fecha_modificacion: new Date(),
              precio_compra: Number(linea.precioUnitario || 0),
            },
          });
        } else {
          await tx.stock.create({
            data: {
              id_producto: Number(linea.productoId),
              cantidad: Number(linea.cantidad || 0),
              fecha_modificacion: new Date(),
              precio: Number(linea.precioUnitario || 0),
              precio_compra: Number(linea.precioUnitario || 0),
            },
          });
        }
      }

      await ejecutarAsientoContableCompra(tx, factura);

      return factura;
    });

    return res.status(201).json({
      ok: true,
      factura: {
        id: resultado.id_factura_compra,
        numero: numero ?? resultado.nro_factura ?? `FAC-P-${String(resultado.id_factura_compra).padStart(4, '0')}`,
        ordenCompraId: Number(id),
        proveedorId: oc.id_proveedor,
        fecha: fecha ?? new Date().toISOString().split('T')[0],
        total: Number(resultado.total),
        totalPagado: 0,
        saldoPendiente: Number(resultado.total),
        estado: 'Aceptada',
        estadoPago: 'Pendiente',
        lineas,
      },
    });
  } catch (error) {
    console.error('Error al registrar factura:', error);
    return res.status(500).json({ error: error.message || 'Error al registrar factura' });
  }
};

// GET /api/ordenes-compra/facturas
export const getFacturas = async (req, res) => {
  try {
    const facturas = await prisma.factura_compra.findMany({
      include: {
        proveedores: true,
        orden_compra: true,
        detalle_factura: { include: { producto: true } },
        detalle_orden_pago_facturas: { select: { id_orden_pago: true, monto_pagado_factura: true } },
      },
      orderBy: { id_factura_compra: 'desc' },
    });
    const data = facturas.map((f) => {
      const total = Number(f.total ?? 0);
      const totalPagado = (f.detalle_orden_pago_facturas ?? []).reduce(
        (acc, d) => acc + Number(d.monto_pagado_factura ?? 0),
        0,
      );
      const saldoPendiente = Math.max(0, total - totalPagado);
      let estadoPago = 'Pendiente';
      if (totalPagado > 0 && saldoPendiente > 0.009) estadoPago = 'Parcial';
      else if (totalPagado > 0 && saldoPendiente <= 0.009) estadoPago = 'Pagada';

      return {
        id: f.id_factura_compra,
        numero: f.nro_factura ?? `FAC-P-${String(f.id_factura_compra).padStart(4, '0')}`,
        timbrado: f.timbrado ?? '—',
        ordenCompraId: f.id_orden_compra ?? null,
        proveedorId: f.id_proveedor,
        fecha: f.fecha_emision?.toISOString().split('T')[0] ?? '—',
        total,
        totalPagado,
        saldoPendiente,
        estado: 'Aceptada',
        estadoPago,
        lineas: (f.detalle_factura ?? []).map((d) => ({
          productoId: d.id_producto,
          nombreProducto: d.producto?.descripcion ?? '—',
          cantidad: Number(d.cantidad_recibida ?? 0),
          precioUnitario: Number(d.precio_unitario ?? 0),
        })),
      };
    });
    return res.json(data);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    return res.status(500).json({ error: 'Error al obtener facturas' });
  }
};

// POST /api/ordenes-compra/devolucion
export const registrarDevolucionCompra = async (req, res) => {
  const { facturaId, motivo, lineas } = req.body;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const { errores } = await validarDevolucionServidor(tx, facturaId, lineas);
      if (errores.length) {
        throw new Error(errores.join(' | '));
      }

      const devolucion = await tx.pedido_devolucion.create({
        data: {
          id_factura_compra: Number(facturaId),
          fecha_emision: new Date(),
          motivo: motivo ?? null,
        },
      });

      for (const item of lineas) {
        await tx.nota_credito_detalle.create({
          data: {
            id_pedido_devolucion: devolucion.id_pedido_d,
            id_producto: Number(item.productoId),
            producto_cantidad: Number(item.cantidad),
          },
        });

        const stock = await tx.stock.findFirst({ where: { id_producto: Number(item.productoId) } });
        if (stock) {
          await tx.stock.update({
            where: { id_stock: stock.id_stock },
            data: {
              cantidad: Math.max(0, (stock.cantidad ?? 0) - Number(item.cantidad)),
              fecha_modificacion: new Date(),
            },
          });
        }
      }
      return devolucion;
    });

    res.status(201).json({ ok: true, id: resultado.id_pedido_d, numero: `ND-P-${resultado.id_pedido_d}` });
  } catch (error) {
    console.error('❌ Error en devolución:', error);
    res.status(400).json({ error: error.message || 'Error al registrar devolución' });
  }
};

// POST /api/ordenes-compra/nota-credito
export const registrarNotaCreditoCompra = async (req, res) => {
  const { notaDevolucionId, numero, monto } = req.body;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const nc = await tx.nota_credito.create({
        data: {
          id_pedido_d: Number(notaDevolucionId),
          numero_nota: numero ? Number(numero.replace(/[^0-9]/g, '')) : null,
          descripcion: `Nota de Crédito Compra ${numero || ''}`,
          monto_subtotal: Number(monto),
          fecha_vencimiento: new Date(),
        },
      });

      await ejecutarAsientoNotaCreditoCompra(tx, nc);

      return nc;
    });

    res.status(201).json({ ok: true, id: resultado.id_nota_credito, numero: numero || `NC-P-${resultado.id_nota_credito}` });
  } catch (error) {
    console.error('❌ Error en NC:', error);
    res.status(500).json({ error: error.message || 'Error al registrar nota de crédito' });
  }
};

// GET /api/ordenes-compra/devoluciones
export const getDevoluciones = async (req, res) => {
  try {
    const devoluciones = await prisma.pedido_devolucion.findMany({
      include: {
        factura_compra: {
          include: {
            proveedores: true,
            detalle_factura: { include: { producto: true } },
          },
        },
        nota_credito_detalle: { include: { producto: true } },
      },
      orderBy: { id_pedido_d: 'desc' },
    });

    const data = devoluciones.map((d) => {
      const lineas = d.nota_credito_detalle.map((it) => {
        const detFac = d.factura_compra?.detalle_factura.find((df) => df.id_producto === it.id_producto);
        const precio = Number(detFac?.precio_unitario ?? 0);
        return {
          productoId: it.id_producto,
          nombreProducto: it.producto?.descripcion ?? '—',
          cantidad: it.producto_cantidad,
          precioUnitario: precio,
          subtotal: it.producto_cantidad * precio,
        };
      });

      const total = lineas.reduce((acc, l) => acc + l.subtotal, 0);

      return {
        id: d.id_pedido_d,
        numero: `ND-P-${String(d.id_pedido_d).padStart(4, '0')}`,
        facturaId: d.id_factura_compra,
        proveedorId: d.factura_compra?.id_proveedor,
        nombreProveedor: d.factura_compra?.proveedores?.nombre,
        fecha: d.fecha_emision?.toISOString().split('T')[0] ?? '—',
        motivo: d.motivo ?? '—',
        lineas,
        total,
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error al obtener devoluciones:', error);
    res.status(500).json({ error: 'Error al obtener devoluciones' });
  }
};

// GET /api/ordenes-compra/notas-credito
export const getNotasCredito = async (req, res) => {
  try {
    const notas = await prisma.nota_credito.findMany({
      include: {
        pedido_devolucion: {
          include: {
            factura_compra: {
              include: {
                proveedores: true,
                detalle_factura: { include: { producto: true } },
              },
            },
            nota_credito_detalle: { include: { producto: true } },
          },
        },
      },
      orderBy: { id_nota_credito: 'desc' },
    });

    const data = notas.map((nc) => {
      const lineas = nc.pedido_devolucion?.nota_credito_detalle.map((it) => {
        const detFac = nc.pedido_devolucion?.factura_compra?.detalle_factura.find((df) => df.id_producto === it.id_producto);
        return {
          productoId: it.id_producto,
          nombreProducto: it.producto?.descripcion ?? '—',
          cantidad: it.producto_cantidad,
          precioUnitario: Number(detFac?.precio_unitario ?? 0),
        };
      });

      return {
        id: nc.id_nota_credito,
        numero: nc.numero_nota ? String(nc.numero_nota) : `NC-P-${String(nc.id_nota_credito).padStart(4, '0')}`,
        notaDevolucionId: nc.id_pedido_d,
        nombreProveedor: nc.pedido_devolucion?.factura_compra?.proveedores?.nombre ?? '—',
        fecha: nc.fecha_vencimiento?.toISOString().split('T')[0] ?? '—',
        monto: Number(nc.monto_subtotal ?? 0),
        lineas,
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error al obtener notas de crédito:', error);
    res.status(500).json({ error: 'Error al obtener notas de crédito' });
  }
};
