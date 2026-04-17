import { useCallback, useEffect, useRef, useState } from 'react';
import { MEDIOS_PAGO_PROVEEDOR } from '../data/erpInitialData';
import { ESTADOS_PEDIDO_COMPRA, LABELS } from '../components/Forms/comprasFormDefaults';
import {
  adjudicarPorMenorPrecio,
  agruparLineasPorProveedor,
  elegirProveedoresCotizacion,
  ordenTienePendienteEntrega,
  totalFactura,
  validarFacturaContraOrden,
} from '../utils/comprasLogic';

let idSeq = 1;
const nid = () => Date.now() + (idSeq++);

const fmtPedido = (n) => `PED-${String(n).padStart(4, '0')}`;
const fmtCot = (n) => `COT-${String(n).padStart(4, '0')}`;
const fmtOc = (n) => `OC-${String(n).padStart(4, '0')}`;
const fmtFac = (n) => `FAC-P-${String(n).padStart(4, '0')}`;
const fmtNd = (n) => `ND-P-${String(n).padStart(4, '0')}`;
const fmtNc = (n) => `NC-P-${String(n).padStart(4, '0')}`;
const fmtOp = (n) => `OP-${String(n).padStart(4, '0')}`;

// Función para normalizar los datos que vienen de la DB al formato que usa el componente
function normalizarInventarioItem(row) {
  const precioRaw = row.precio;
  const precioNum = Number(precioRaw) || 0;
  
  return {
    ...row,
    id: row.id, // id_producto de la DB
    nombreProducto: row.nombre, // descripcion de la DB
    stock: Number(row.stock) || 0,
    min: Number(row.min) || 10,
    precioNum,
    precio: precioNum > 0 ? precioNum.toLocaleString('de-DE') : '—',
  };
}

export function useModuloCompras() {
  // --- ESTADOS DE DATOS (AHORA INICIAN VACÍOS) ---
  const [proveedores, setProveedores] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE PROCESO (LOCALES POR AHORA) ---
  const [pedidosCotizacion, setPedidosCotizacion] = useState([]);
  const [cotizacionesProveedor, setCotizacionesProveedor] = useState([]);
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [facturasProveedor, setFacturasProveedor] = useState([]);
  const [notasDevolucion, setNotasDevolucion] = useState([]);
  const [notasCreditoProveedor, setNotasCreditoProveedor] = useState([]);
  const [ordenesPagoProveedores, setOrdenesPagoProveedores] = useState([]);
  const [asientosCompras, setAsientosCompras] = useState([]);

  // --- REFS ---
  const cotSeqRef = useRef(1);
  const ocSeqRef = useRef(1);
  const facSeqRef = useRef(1);
  const ndSeqRef = useRef(1);
  const ncSeqRef = useRef(1);
  const opSeqRef = useRef(1);
  const asSeqRef = useRef(1);

  const proveedoresRef = useRef(proveedores);
  useEffect(() => { proveedoresRef.current = proveedores; }, [proveedores]);
  
  const facturasRef = useRef(facturasProveedor);
  useEffect(() => { facturasRef.current = facturasProveedor; }, [facturasProveedor]);

  // --- FUNCIONES DE CARGA (FETCH) ---

  const fetchTodo = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      
      // Cargamos Productos, Pedidos y Proveedores en paralelo
      const [resProd, resPed, resProv] = await Promise.all([
        fetch('/api/productos', { headers }),
        fetch('/api/compras/pedidos', { headers }),
        fetch('/api/proveedores', { headers }) // Asumiendo que tienes esta ruta
      ]);

      if (resProd.ok) {
        const dataProd = await resProd.json();
        setInventario(dataProd.map(normalizarInventarioItem));
      }

      if (resPed.ok) {
        const dataPed = await resPed.json();
        const dataMapeada = dataPed.map(p => ({
          ...p,
          items: p.items.map(it => ({
            ...it,
            nombreProducto: it.nombre
          }))
        }));
        setPedidos(dataMapeada);
      }

      if (resProv.ok) {
        const dataProv = await resProv.json();
        setProveedores(dataProv);
      }
    } catch (err) {
      console.error("Error cargando datos del módulo:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodo();
  }, [fetchTodo]);

  // --- GUARDAR PEDIDO (CREATE) ---
  const guardarPedidoCompra = useCallback(async (items) => {
    try {
      const res = await fetch('/api/compras/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ items })
      });

      if (res.ok) {
        await fetchTodo(); // Refrescar todo para ver cambios
        return { ok: true };
      } else {
        const errData = await res.json();
        return { ok: false, error: errData.error };
      }
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      return { ok: false, error: "Error de conexión" };
    }
  }, [fetchTodo]);

  // --- LÓGICA DE NEGOCIO (IGUAL A TU ORIGINAL) ---

  const agregarAsiento = useCallback((tipo, descripcion, monto, ref) => {
    const n = asSeqRef.current++;
    const row = {
      id: nid(),
      numero: `AS-${String(n).padStart(4, '0')}`,
      fecha: new Date().toISOString().slice(0, 10),
      tipo,
      descripcion,
      debe: monto,
      haber: monto,
      ref,
    };
    setAsientosCompras((prev) => [row, ...prev]);
  }, []);

  const generarPedidoCotizacion = useCallback((pedidoCompra) => {
    const items = pedidoCompra.items ?? [];
    if (items.length === 0) return { ok: false, error: 'El pedido no tiene ítems.' };
    const provs = proveedoresRef.current;
    const { proveedorIds, advertencia } = elegirProveedoresCotizacion(items, provs);
    if (proveedorIds.length < 1) return { ok: false, error: 'No hay proveedores registrados.' };

    const pcId = nid();
    const numero = fmtCot(cotSeqRef.current++);
    const pedidoCot = {
      id: pcId,
      numero,
      pedidoCompraId: pedidoCompra.id,
      fechaEnvio: new Date().toISOString().slice(0, 10),
      proveedorIds,
      estado: 'Enviado',
      advertencia,
    };

    const nuevasCotizaciones = proveedorIds.map((proveedorId) => ({
      id: nid(),
      pedidoCotizacionId: pcId,
      proveedorId,
      fechaRespuesta: null,
      lineas: items.map((it) => ({
        productoId: it.productoId,
        nombreProducto: it.nombreProducto,
        cantidadSolicitada: it.cantidad,
        precioUnitario: '',
      })),
      estado: 'Pendiente',
    }));

    setPedidosCotizacion((prev) => [pedidoCot, ...prev]);
    setCotizacionesProveedor((prev) => [...nuevasCotizaciones, ...prev]);
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoCompra.id ? { ...p, estado: ESTADOS_PEDIDO_COMPRA.EN_COTIZACION } : p
      )
    );
    return { ok: true, pedidoCot, advertencia };
  }, []);

  const actualizarCotizacionProveedor = useCallback((cotizacionId, lineas, fechaRespuesta) => {
    setCotizacionesProveedor((prev) =>
      prev.map((c) =>
        c.id === cotizacionId
          ? { ...c, lineas, fechaRespuesta: fechaRespuesta || new Date().toISOString().slice(0, 10), estado: 'Recibida' }
          : c
      )
    );
  }, []);

  const adjudicarYGenerarOrdenes = useCallback((pedidoCotizacion) => {
    const pedidoCompra = pedidos.find((p) => p.id === pedidoCotizacion.pedidoCompraId);
    if (!pedidoCompra) return { ok: false, error: 'Pedido no encontrado.' };

    const items = pedidoCompra.items ?? [];
    const cotizaciones = cotizacionesProveedor.filter((c) => c.pedidoCotizacionId === pedidoCotizacion.id);
    const cotParaLogica = cotizaciones.map((c) => ({
      proveedorId: c.proveedorId,
      lineas: (c.lineas ?? []).map((l) => ({
        productoId: l.productoId,
        precioUnitario: l.precioUnitario === '' ? null : Number(l.precioUnitario),
      })),
    }));

    const porProducto = adjudicarPorMenorPrecio(items, cotParaLogica);
    const grupos = agruparLineasPorProveedor(items, porProducto);
    const provKeys = Object.keys(grupos);
    if (provKeys.length === 0) return { ok: false, error: 'Faltan precios en las cotizaciones.' };

    const nuevasOc = [];
    for (const proveedorIdStr of provKeys) {
      const proveedorId = Number(proveedorIdStr);
      const lineas = grupos[proveedorIdStr].map((row) => ({
        productoId: row.productoId,
        nombreProducto: row.nombreProducto,
        cantidadPedida: row.cantidad,
        precioUnitario: row.precioUnitario,
      }));
      nuevasOc.push({
        id: nid(),
        numero: fmtOc(ocSeqRef.current++),
        proveedorId,
        pedidoCotizacionId: pedidoCotizacion.id,
        pedidoCompraId: pedidoCompra.id,
        fecha: new Date().toISOString().slice(0, 10),
        lineas,
        estado: 'Pendiente entrega',
      });
    }

    setOrdenesCompra((prev) => [...nuevasOc, ...prev]);
    setPedidosCotizacion((prev) =>
      prev.map((p) => (p.id === pedidoCotizacion.id ? { ...p, estado: 'Adjudicado' } : p))
    );
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoCompra.id ? { ...p, estado: ESTADOS_PEDIDO_COMPRA.ADJUDICADO } : p
      )
    );
    return { ok: true, ordenes: nuevasOc };
  }, [pedidos, cotizacionesProveedor]);

  const registrarFacturaYStock = useCallback((ordenCompra, payload) => {
    const { numero, timbrado, fecha, lineas } = payload;
    const facturaId = nid();
    const numeroFac = numero?.trim() || fmtFac(facSeqRef.current++);
    const v = validarFacturaContraOrden(ordenCompra, lineas, facturasRef.current, null);
    if (!v.ok) return { ok: false, errores: v.errores };

    const total = totalFactura(lineas);
    const factura = {
      id: facturaId,
      numero: numeroFac,
      timbrado: timbrado?.trim() ?? '',
      ordenCompraId: ordenCompra.id,
      proveedorId: ordenCompra.proveedorId,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      lineas,
      estado: 'Aceptada',
      estadoPago: 'Pendiente',
      total,
    };

    setFacturasProveedor(prev => [factura, ...prev]);
    setInventario((inv) =>
      inv.map((prod) => {
        const ent = lineas.find((l) => l.productoId === prod.id);
        if (!ent) return prod;
        return { ...prod, stock: (Number(prod.stock) || 0) + (Number(ent.cantidad) || 0) };
      })
    );

    const prov = proveedoresRef.current.find((p) => p.id === ordenCompra.proveedorId);
    agregarAsiento(LABELS.asientoCompra, `Compra ${factura.numero} — ${prov?.nombre}`, total, { facturaId });

    setOrdenesCompra((prev) =>
      prev.map((oc) => {
        if (oc.id !== ordenCompra.id) return oc;
        const tienePendiente = ordenTienePendienteEntrega(oc, [factura, ...facturasRef.current]);
        return { ...oc, estado: tienePendiente ? 'Entrega parcial' : 'Cerrada' };
      })
    );
    return { ok: true, factura };
  }, [agregarAsiento]);

  const registrarNotaDevolucion = useCallback((factura, payload) => {
    const { motivo, lineas } = payload;
    const nd = {
      id: nid(),
      numero: fmtNd(ndSeqRef.current++),
      facturaId: factura.id,
      proveedorId: factura.proveedorId,
      fecha: new Date().toISOString().slice(0, 10),
      motivo,
      lineas,
      total: totalFactura(lineas),
    };
    setNotasDevolucion((prev) => [nd, ...prev]);
    setInventario((inv) =>
      inv.map((prod) => {
        const dev = lineas.find((l) => l.productoId === prod.id);
        return dev ? { ...prod, stock: Math.max(0, Number(prod.stock) - Number(dev.cantidad)) } : prod;
      })
    );
    return { ok: true, nota: nd };
  }, []);

  const registrarNotaCreditoProveedor = useCallback((notaDevolucion, payload) => {
    const { numero, monto } = payload;
    const ncId = nid();
    const m = Number(monto) || notaDevolucion.total;
    const nc = {
      id: ncId,
      numero: numero?.trim() || fmtNc(ncSeqRef.current++),
      notaDevolucionId: notaDevolucion.id,
      proveedorId: notaDevolucion.proveedorId,
      fecha: new Date().toISOString().slice(0, 10),
      monto: m,
    };
    setNotasCreditoProveedor((prev) => [nc, ...prev]);
    agregarAsiento(LABELS.asientoNC, `NC ${nc.numero}`, m, { notaCreditoId: ncId });
    return { ok: true, notaCredito: nc };
  }, [agregarAsiento]);

  const registrarOrdenPago = useCallback((payload) => {
    const { proveedorId, facturaIds, medios } = payload;
    if (!facturaIds?.length) return { ok: false, error: 'Sin facturas.' };
    const op = {
      id: nid(),
      numero: fmtOp(opSeqRef.current++),
      proveedorId,
      fecha: new Date().toISOString().slice(0, 10),
      facturaIds,
      medios: medios ?? [],
      total: medios.reduce((a, m) => a + Number(m.monto), 0),
      estado: 'Registrada',
    };
    setOrdenesPagoProveedores((prev) => [op, ...prev]);
    setFacturasProveedor((prev) =>
      prev.map((f) => (facturaIds.includes(f.id) ? { ...f, estadoPago: 'Pagada' } : f))
    );
    return { ok: true, ordenPago: op };
  }, []);

  const productosBajoMinimo = useCallback(() => {
    return inventario.filter((p) => Number(p.stock) <= Number(p.min));
  }, [inventario]);

  return {
    MEDIOS_PAGO_PROVEEDOR,
    proveedores,
    setProveedores,
    inventario,
    setInventario,
    pedidos,
    pedidosCotizacion,
    cotizacionesProveedor,
    ordenesCompra,
    facturasProveedor,
    notasDevolucion,
    notasCreditoProveedor,
    ordenesPagoProveedores,
    asientosCompras,
    loading,
    guardarPedidoCompra,
    generarPedidoCotizacion,
    actualizarCotizacionProveedor,
    adjudicarYGenerarOrdenes,
    registrarFacturaYStock,
    registrarNotaDevolucion,
    registrarNotaCreditoProveedor,
    registrarOrdenPago,
    productosBajoMinimo,
  };
}