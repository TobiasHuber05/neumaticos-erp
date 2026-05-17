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

function normalizarInventarioItem(row) {
  const precioRaw = row.precio;
  const precioNum = Number(precioRaw) || 0;
  
  return {
    ...row,
    id: row.id, 
    nombreProducto: row.nombre, 
    stock: Number(row.stock) || 0,
    min: Number(row.min) || 10,
    precioNum,
    precio: precioNum > 0 ? precioNum.toLocaleString('de-DE') : '—',
  };
}

export function useModuloCompras() {
  const [proveedores, setProveedores] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pedidosCotizacion, setPedidosCotizacion] = useState([]);
  const [cotizacionesProveedor, setCotizacionesProveedor] = useState([]);
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [facturasProveedor, setFacturasProveedor] = useState([]);
  const [notasDevolucion, setNotasDevolucion] = useState([]);
  const [notasCreditoProveedor, setNotasCreditoProveedor] = useState([]);
  const [ordenesPagoProveedores, setOrdenesPagoProveedores] = useState([]);
  const [asientosCompras, setAsientosCompras] = useState([]);

  const proveedoresRef = useRef(proveedores);
  useEffect(() => { proveedoresRef.current = proveedores; }, [proveedores]);
  
  const facturasRef = useRef(facturasProveedor);
  useEffect(() => { facturasRef.current = facturasProveedor; }, [facturasProveedor]);

  const fetchTodo = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      
      const [resProd, resPed, resProv, resCot, resOc, resFac, resDev, resNc] = await Promise.all([
        fetch('/api/productos', { headers }),
        fetch('/api/compras/pedidos', { headers }),
        fetch('/api/proveedores', { headers }),
        fetch('/api/cotizaciones', { headers }),
        fetch('/api/ordenes-compra', { headers }),
        fetch('/api/ordenes-compra/facturas', { headers }),
        fetch('/api/ordenes-compra/devoluciones', { headers }),
        fetch('/api/ordenes-compra/notas-credito', { headers })
      ]);

      if (resProd.ok) {
        const dataProd = await resProd.json();
        setInventario(dataProd.map(normalizarInventarioItem));
      }

      if (resPed.ok) {
        const dataPed = await resPed.json();
        setPedidos(dataPed.map(p => ({
          ...p,
          items: p.items.map(it => ({ ...it, nombreProducto: it.nombreProducto || it.nombre }))
        })));
      }

      if (resProv.ok) {
        setProveedores(await resProv.json());
      }

      if (resCot.ok) {
        const dataCot = await resCot.json();
        // Agrupar cotizaciones por pedido para pedidosCotizacion
        const groups = {};
        const allCots = [];
        dataCot.forEach(c => {
          if (!groups[c.idPedidoProducto]) {
            groups[c.idPedidoProducto] = {
              id: c.idPedidoProducto,
              pedidoCompraId: c.idPedidoProducto,
              fechaEnvio: c.fecha?.split('T')[0],
              estado: c.estado === 'Adjudicado' ? 'Adjudicado' : 'Enviado',
            };
          }
          allCots.push({
            id: c.id,
            pedidoCotizacionId: c.idPedidoProducto,
            proveedorId: c.proveedor.id,
            fechaRespuesta: c.fecha?.split('T')[0],
            estado: c.estado === 'Adjudicado' ? 'Respondido' : 'Pendiente',
            lineas: c.lineas.map(l => ({
              id: l.id,
              productoId: l.productoId,
              nombreProducto: l.nombreProducto,
              cantidadSolicitada: l.cantidadSolicitada,
              precioUnitario: l.precio || ''
            }))
          });
        });
        setPedidosCotizacion(Object.values(groups));
        setCotizacionesProveedor(allCots);
      }

      if (resOc.ok) {
        setOrdenesCompra(await resOc.json());
      }

      if (resFac.ok) {
        setFacturasProveedor(await resFac.json());
      }

      if (resDev && resDev.ok) {
        setNotasDevolucion(await resDev.json());
      }

      if (resNc && resNc.ok) {
        setNotasCreditoProveedor(await resNc.json());
      }

    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodo();
  }, [fetchTodo]);

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
        await fetchTodo();
        return { ok: true };
      }
      const errData = await res.json();
      return { ok: false, error: errData.error };
    } catch (error) {
      return { ok: false, error: "Error de conexión" };
    }
  }, [fetchTodo]);

  const generarPedidoCotizacion = useCallback(async (pedidoCompra) => {
    const items = pedidoCompra.items ?? [];
    if (items.length === 0) return { ok: false, error: 'El pedido no tiene ítems.' };
    const provs = proveedoresRef.current;
    const { proveedorIds, advertencia } = elegirProveedoresCotizacion(items, provs);
    if (proveedorIds.length < 1) return { ok: false, error: 'No hay proveedores registrados.' };

    try {
      const res = await fetch('/api/cotizaciones/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ idPedidoProducto: pedidoCompra.id, proveedorIds })
      });
      if (res.ok) {
        await fetchTodo();
        return { ok: true, advertencia };
      }
      const errData = await res.json();
      return { ok: false, error: errData.error };
    } catch (error) {
      return { ok: false, error: "Error de conexión" };
    }
  }, [fetchTodo]);

  const actualizarCotizacionProveedor = useCallback(async (cotizacionId, lineas, fechaRespuesta) => {
    try {
      const res = await fetch(`/api/cotizaciones/${cotizacionId}/precios`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ lineas: lineas.map(l => ({ id: l.id, precio: l.precioUnitario })), fechaRespuesta })
      });
      if (res.ok) {
        await fetchTodo();
        return { ok: true };
      }
    } catch (error) {
      console.error(error);
    }
  }, [fetchTodo]);

  const adjudicarYGenerarOrdenes = useCallback(async (pedidoCotizacion) => {
    try {
      const res = await fetch('/api/cotizaciones/adjudicar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ idPedidoProducto: pedidoCotizacion.id })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchTodo();
        return { ok: true, ordenes: data.ordenes };
      }
      const errData = await res.json();
      return { ok: false, error: errData.error };
    } catch (error) {
      return { ok: false, error: "Error de conexión" };
    }
  }, [fetchTodo]);

  const registrarFacturaYStock = useCallback(async (ordenCompra, payload) => {
    const { numero, timbrado, fecha, lineas } = payload;
    try {
      const res = await fetch(`/api/ordenes-compra/${ordenCompra.id}/factura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ numero, timbrado, fecha, lineas })
      });
      if (res.ok) {
        await fetchTodo();
        return { ok: true };
      }
      const errData = await res.json();
      return { ok: false, error: errData.error };
    } catch (error) {
      return { ok: false, error: "Error de conexión" };
    }
  }, [fetchTodo]);

  const registrarNotaDevolucion = useCallback(async (factura, payload) => {
    const { motivo, lineas } = payload;
    try {
      const res = await fetch('/api/ordenes-compra/devolucion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ facturaId: factura.id, motivo, lineas })
      });
      if (res.ok) {
        await fetchTodo();
        return { ok: true };
      }
      const errData = await res.json();
      return { ok: false, error: errData.error };
    } catch (error) {
      return { ok: false, error: "Error de conexión" };
    }
  }, [fetchTodo]);

  const registrarNotaCreditoProveedor = useCallback(async (notaDevolucion, payload) => {
    const { numero, monto } = payload;
    try {
      const res = await fetch('/api/ordenes-compra/nota-credito', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notaDevolucionId: notaDevolucion.id, numero, monto })
      });
      if (res.ok) {
        await fetchTodo();
        return { ok: true };
      }
      const errData = await res.json();
      return { ok: false, error: errData.error };
    } catch (error) {
      return { ok: false, error: "Error de conexión" };
    }
  }, [fetchTodo]);

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