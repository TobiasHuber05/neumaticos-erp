const STOCK_MINIMO_DEFAULT = 10;

export const registrarMovimientoStock = async (
  tx,
  { id_producto, tipo_movimiento, cantidad, stock_resultante, origen, id_origen, descripcion },
) => {
  if (!id_producto || !cantidad) return null;

  return tx.movimiento_stock.create({
    data: {
      id_producto: Number(id_producto),
      tipo_movimiento,
      cantidad: Number(cantidad),
      stock_resultante: stock_resultante == null ? null : Number(stock_resultante),
      origen,
      id_origen: id_origen == null ? null : Number(id_origen),
      descripcion,
    },
  });
};

export const crearPedidoReposicionSiCorresponde = async (tx, id_producto) => {
  const stock = await tx.stock.findFirst({
    where: { id_producto: Number(id_producto), activo: true },
    include: { producto: true },
  });

  if (!stock || stock.producto?.es_servicio) return null;

  const cantidadActual = Number(stock.cantidad ?? 0);
  const minimo = Number(stock.stock_minimo ?? STOCK_MINIMO_DEFAULT);
  if (cantidadActual > minimo) return null;

  const pedidoPendiente = await tx.pedidos_productos.findFirst({
    where: {
      detalles_pedidos: { some: { id_producto: Number(id_producto) } },
      OR: [
        { cotizacion: { none: {} } },
        { cotizacion: { some: { orden_compra: { none: {} } } } },
      ],
    },
  });

  if (pedidoPendiente) return pedidoPendiente;

  const cantidadSugerida = Math.max(minimo * 2 - cantidadActual, minimo);

  return tx.pedidos_productos.create({
    data: {
      fecha: new Date(),
      detalles_pedidos: {
        create: {
          id_producto: Number(id_producto),
          cantidad: cantidadSugerida,
        },
      },
    },
  });
};

export const registrarSalidaStock = async (
  tx,
  { id_producto, cantidad, origen, id_origen, descripcion, crearReposicion = true },
) => {
  const stock = await tx.stock.findFirst({
    where: { id_producto: Number(id_producto), activo: true },
  });

  if (!stock) {
    throw new Error(`No existe stock activo para el producto ${id_producto}`);
  }

  const cantidadSalida = Number(cantidad);
  const stockActual = Number(stock.cantidad ?? 0);
  if (cantidadSalida <= 0) return stock;
  if (stockActual < cantidadSalida) {
    throw new Error(`Stock insuficiente para el producto ${id_producto}. Disponible ${stockActual}.`);
  }

  const actualizado = await tx.stock.update({
    where: { id_stock: stock.id_stock },
    data: {
      cantidad: stockActual - cantidadSalida,
      fecha_modificacion: new Date(),
    },
  });

  await registrarMovimientoStock(tx, {
    id_producto,
    tipo_movimiento: 'Salida',
    cantidad: cantidadSalida,
    stock_resultante: actualizado.cantidad,
    origen,
    id_origen,
    descripcion,
  });

  if (crearReposicion) {
    await crearPedidoReposicionSiCorresponde(tx, id_producto);
  }

  return actualizado;
};

export const registrarEntradaStock = async (
  tx,
  { id_producto, cantidad, precio, precio_compra, origen, id_origen, descripcion },
) => {
  const stock = await tx.stock.findFirst({
    where: { id_producto: Number(id_producto), activo: true },
  });

  const cantidadEntrada = Number(cantidad);
  if (cantidadEntrada <= 0) return stock;

  const actualizado = stock
    ? await tx.stock.update({
        where: { id_stock: stock.id_stock },
        data: {
          cantidad: Number(stock.cantidad ?? 0) + cantidadEntrada,
          fecha_modificacion: new Date(),
          precio: precio == null ? stock.precio : Number(precio),
          precio_compra: precio_compra == null ? stock.precio_compra : Number(precio_compra),
        },
      })
    : await tx.stock.create({
        data: {
          id_producto: Number(id_producto),
          cantidad: cantidadEntrada,
          fecha_modificacion: new Date(),
          precio: precio == null ? null : Number(precio),
          precio_compra: precio_compra == null ? null : Number(precio_compra),
          stock_minimo: STOCK_MINIMO_DEFAULT,
        },
      });

  await registrarMovimientoStock(tx, {
    id_producto,
    tipo_movimiento: 'Entrada',
    cantidad: cantidadEntrada,
    stock_resultante: actualizado.cantidad,
    origen,
    id_origen,
    descripcion,
  });

  return actualizado;
};
