const MIN_PROVEEDORES_COTIZACION = 3;




/**
 * Proveedores cuya oferta incluye al menos una categoría pedida.
 */
export function proveedoresPorCategoriasProductos(items, proveedores) {
  const cats = new Set(items.map((i) => i.categoria).filter(Boolean));
  return proveedores.filter((p) =>
    (p.categorias ?? []).some((c) => cats.has(c)),
  );
}

export function elegirProveedoresCotizacion(items, proveedores, min = MIN_PROVEEDORES_COTIZACION) {
  const elegibles = proveedoresPorCategoriasProductos(items, proveedores);
  const ids = elegibles.map((p) => p.id);
  const suficientes = ids.length >= min;
  const seleccionados = suficientes ? ids.slice(0, Math.max(min, ids.length)) : ids;
  return {
    proveedorIds: seleccionados,
    elegibles,
    advertencia: !suficientes
      ? `Solo hay ${ids.length} proveedor(es) con categorías que cubren este pedido. Se requiere al menos ${min} para el proceso ideal.`
      : null,
  };
}

/**
 * Por cada ítem del pedido, elige el proveedor con menor precio unitario cotizado.
 * Devuelve mapa productoId -> { proveedorId, precioUnitario } y agrupación por proveedor.
 */
export function adjudicarPorMenorPrecio(items, cotizacionesProveedor) {
  const porProducto = {};
  for (const item of items) {
    const pid = item.productoId;
    let mejor = null;
    for (const cot of cotizacionesProveedor) {
      const linea = cot.lineas?.find((l) => l.productoId === pid);
      if (!linea || linea.precioUnitario == null) continue;
      const precio = Number(linea.precioUnitario);
      if (!Number.isFinite(precio)) continue;
      if (!mejor || precio < mejor.precioUnitario) {
        mejor = { proveedorId: cot.proveedorId, precioUnitario: precio };
      }
    }
    if (mejor) porProducto[pid] = mejor;
  }
  return porProducto;
}

export function agruparLineasPorProveedor(items, porProducto) {
  const grupos = {};
  for (const item of items) {
    const adj = porProducto[item.productoId];
    if (!adj) continue;
    const provId = adj.proveedorId;
    if (!grupos[provId]) grupos[provId] = [];
    grupos[provId].push({
      ...item,
      precioUnitario: adj.precioUnitario,
    });
  }
  return grupos;
}

/**
 * Cantidad ya facturada por línea de OC (suma de facturas previas).
 */
export function cantidadFacturadaPorLinea(ordenCompra, facturasProveedor, excludeFacturaId = null) {
  const map = {};
  for (const linea of ordenCompra.lineas) {
    map[linea.productoId] = 0;
  }
  for (const fac of facturasProveedor) {
    if (fac.ordenCompraId !== ordenCompra.id) continue;
    if (excludeFacturaId && fac.id === excludeFacturaId) continue;
    if (fac.estado === 'Anulada') continue;
    if (fac.estado !== 'Aceptada') continue;
    for (const l of fac.lineas ?? []) {
      map[l.productoId] = (map[l.productoId] ?? 0) + Number(l.cantidad || 0);
    }
  }
  return map;
}

export function validarFacturaContraOrden(ordenCompra, facturaLineas, facturasExistentes, excludeFacturaId = null) {
  const ya = cantidadFacturadaPorLinea(ordenCompra, facturasExistentes, excludeFacturaId);
  const errores = [];
  for (const fl of facturaLineas) {
    const ocLinea = ordenCompra.lineas.find((l) => l.productoId === fl.productoId);
    if (!ocLinea) {
      errores.push(`Producto no está en la orden de compra: ${fl.productoId}`);
      continue;
    }
    const pedida = Number(ocLinea.cantidadPedida);
    const recibidaAntes = ya[fl.productoId] ?? 0;
    const enFactura = Number(fl.cantidad);
    if (enFactura + recibidaAntes > pedida) {
      errores.push(
        `${ocLinea.nombreProducto}: no puede entregarse más de lo pedido (pedido ${pedida}, ya facturado ${recibidaAntes}, esta factura ${enFactura}).`,
      );
    }
  }
  return { ok: errores.length === 0, errores };
}

export function totalFactura(lineas) {
  return (lineas ?? []).reduce(
    (acc, l) => acc + Number(l.cantidad || 0) * Number(l.precioUnitario || 0),
    0,
  );
}

/** Cantidad pendiente de entregar por producto en una OC (pedido − facturado en facturas aceptadas). */
export function cantidadPendientePorLinea(ordenCompra, facturasProveedor) {
  const facturada = cantidadFacturadaPorLinea(ordenCompra, facturasProveedor);
  const out = {};
  for (const linea of ordenCompra.lineas) {
    const pedida = Number(linea.cantidadPedida);
    out[linea.productoId] = Math.max(0, pedida - (facturada[linea.productoId] ?? 0));
  }
  return out;
}

export function ordenTienePendienteEntrega(ordenCompra, facturasProveedor) {
  const pend = cantidadPendientePorLinea(ordenCompra, facturasProveedor);
  return Object.values(pend).some((q) => q > 0);
}

export function facturasDeOrden(facturasProveedor, ordenCompraId) {
  return (facturasProveedor ?? []).filter(
    (f) => f.ordenCompraId === ordenCompraId && f.estado !== 'Anulada',
  );
}
