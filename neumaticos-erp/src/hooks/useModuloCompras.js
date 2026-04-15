import { useCallback, useEffect, useRef, useState } from 'react';
import {
  proveedoresIniciales,
  inventarioInicial,
  MEDIOS_PAGO_PROVEEDOR,
} from '../data/erpInitialData';
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
  const precioNum =
    typeof precioRaw === 'number'
      ? precioRaw
      : Number(String(precioRaw ?? '').replace(/\./g, '').replace(/,/g, '')) || 0;
  return {
    ...row,
    stock: Number(row.stock) || 0,
    min: Number(row.min) || 0,
    precioNum,
    precio:
      typeof precioRaw === 'string' && precioRaw.includes('.')
        ? precioRaw
        : precioNum > 0
          ? precioNum.toLocaleString('de-DE')
          : String(precioRaw ?? '—'),
  };
}

export function useModuloCompras() {
  const [proveedores, setProveedores] = useState(() =>
    proveedoresIniciales.map((p) => ({ ...p, categorias: [...(p.categorias ?? [])] })),
  );
  const [inventario, setInventario] = useState(() => inventarioInicial.map(normalizarInventarioItem));

  const pedidoSeqRef = useRef(3);
  const cotSeqRef = useRef(1);
  const ocSeqRef = useRef(1);
  const facSeqRef = useRef(1);
  const ndSeqRef = useRef(1);
  const ncSeqRef = useRef(1);
  const opSeqRef = useRef(1);
  const asSeqRef = useRef(1);

  const [pedidos, setPedidos] = useState(() => [
    {
      id: nid(),
      numero: fmtPedido(1),
      fecha: '2026-03-30',
      productos: 2,
      estado: ESTADOS_PEDIDO_COMPRA.PENDIENTE_COTIZACION,
      items: [
        {
          id: nid(),
          productoId: 1,
          nombreProducto: 'Michelin Primacy 4',
          categoria: 'Neumáticos Auto',
          cantidad: 20,
        },
        {
          id: nid(),
          productoId: 3,
          nombreProducto: 'Bridgestone Turanza',
          categoria: 'Neumáticos Auto',
          cantidad: 15,
        },
      ],
    },
    {
      id: nid(),
      numero: fmtPedido(2),
      fecha: '2026-03-31',
      productos: 1,
      estado: ESTADOS_PEDIDO_COMPRA.PENDIENTE_COTIZACION,
      items: [
        {
          id: nid(),
          productoId: 2,
          nombreProducto: 'Pirelli Scorpion AT',
          categoria: 'Neumáticos Camioneta',
          cantidad: 8,
        },
      ],
    },
  ]);

  const [pedidosCotizacion, setPedidosCotizacion] = useState([]);
  const [cotizacionesProveedor, setCotizacionesProveedor] = useState([]);
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [facturasProveedor, setFacturasProveedor] = useState([]);
  const [notasDevolucion, setNotasDevolucion] = useState([]);
  const [notasCreditoProveedor, setNotasCreditoProveedor] = useState([]);
  const [ordenesPagoProveedores, setOrdenesPagoProveedores] = useState([]);
  const [asientosCompras, setAsientosCompras] = useState([]);

  const proveedoresRef = useRef(proveedores);
  proveedoresRef.current = proveedores;
  const facturasRef = useRef(facturasProveedor);
  useEffect(() => {
    facturasRef.current = facturasProveedor;
  }, [facturasProveedor]);

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

  const guardarPedidoCompra = useCallback((items) => {
    const hoy = new Date().toISOString().slice(0, 10);
    const n = pedidoSeqRef.current++;
    const nuevo = {
      id: nid(),
      numero: fmtPedido(n),
      fecha: hoy,
      productos: items.length,
      estado: ESTADOS_PEDIDO_COMPRA.PENDIENTE_COTIZACION,
      items,
    };
    setPedidos((prev) => [nuevo, ...prev]);
  }, []);

  const generarPedidoCotizacion = useCallback(
    (pedidoCompra) => {
      const items = pedidoCompra.items ?? [];
      if (items.length === 0) return { ok: false, error: 'El pedido no tiene ítems.' };

      const provs = proveedoresRef.current;
      const { proveedorIds, advertencia } = elegirProveedoresCotizacion(items, provs);
      if (proveedorIds.length < 1) {
        return { ok: false, error: 'No hay proveedores con las categorías de los productos pedidos.' };
      }

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
          p.id === pedidoCompra.id ? { ...p, estado: ESTADOS_PEDIDO_COMPRA.EN_COTIZACION } : p,
        ),
      );

      return { ok: true, pedidoCot, advertencia };
    },
    [],
  );

  const actualizarCotizacionProveedor = useCallback((cotizacionId, lineas, fechaRespuesta) => {
    setCotizacionesProveedor((prev) =>
      prev.map((c) =>
        c.id === cotizacionId
          ? {
              ...c,
              lineas,
              fechaRespuesta: fechaRespuesta || new Date().toISOString().slice(0, 10),
              estado: 'Recibida',
            }
          : c,
      ),
    );
  }, []);

  const adjudicarYGenerarOrdenes = useCallback((pedidoCotizacion) => {
    const pedidoCompra = pedidos.find((p) => p.id === pedidoCotizacion.pedidoCompraId);
    if (!pedidoCompra) return { ok: false, error: 'Pedido de compra no encontrado.' };

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
    if (provKeys.length === 0) {
      return {
        ok: false,
        error:
          'No hay cotizaciones completas: cargá precios en al menos un proveedor por cada producto.',
      };
    }

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
      prev.map((p) => (p.id === pedidoCotizacion.id ? { ...p, estado: 'Adjudicado' } : p)),
    );
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoCompra.id ? { ...p, estado: ESTADOS_PEDIDO_COMPRA.ADJUDICADO } : p,
      ),
    );

    return { ok: true, ordenes: nuevasOc };
  }, [pedidos, cotizacionesProveedor]);

  const registrarFacturaYStock = useCallback(
    (ordenCompra, payload) => {
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

      const nextFacturas = [factura, ...facturasRef.current];
      setFacturasProveedor(nextFacturas);

      setInventario((inv) =>
        inv.map((prod) => {
          const ent = lineas.find((l) => l.productoId === prod.id);
          if (!ent) return prod;
          const add = Number(ent.cantidad) || 0;
          return { ...prod, stock: (Number(prod.stock) || 0) + add };
        }),
      );

      const prov = proveedoresRef.current.find((p) => p.id === ordenCompra.proveedorId);
      agregarAsiento(
        LABELS.asientoCompra,
        `Compra según ${factura.numero} — ${prov?.nombre ?? 'Proveedor'}`,
        total,
        { facturaId, ordenCompraId: ordenCompra.id },
      );

      setOrdenesCompra((prev) =>
        prev.map((oc) => {
          if (oc.id !== ordenCompra.id) return oc;
          const tienePendiente = ordenTienePendienteEntrega(oc, nextFacturas);
          return { ...oc, estado: tienePendiente ? 'Entrega parcial' : 'Cerrada' };
        }),
      );

      return { ok: true, factura };
    },
    [agregarAsiento],
  );

  const registrarNotaDevolucion = useCallback((factura, payload) => {
    const { motivo, lineas } = payload;
    const ndId = nid();
    const numeroNd = fmtNd(ndSeqRef.current++);

    const totalDev = totalFactura(lineas);
    const nd = {
      id: ndId,
      numero: numeroNd,
      facturaId: factura.id,
      proveedorId: factura.proveedorId,
      fecha: new Date().toISOString().slice(0, 10),
      motivo,
      lineas,
      total: totalDev,
    };
    setNotasDevolucion((prev) => [nd, ...prev]);

    setInventario((inv) =>
      inv.map((prod) => {
        const dev = lineas.find((l) => l.productoId === prod.id);
        if (!dev) return prod;
        const sub = Number(dev.cantidad) || 0;
        return { ...prod, stock: Math.max(0, (Number(prod.stock) || 0) - sub) };
      }),
    );

    return { ok: true, nota: nd };
  }, []);

  const registrarNotaCreditoProveedor = useCallback(
    (notaDevolucion, payload) => {
      const { numero, fecha, monto } = payload;
      const ncId = nid();
      const numeroNc = numero?.trim() || fmtNc(ncSeqRef.current++);
      const m = Number(monto) || notaDevolucion.total;
      const nc = {
        id: ncId,
        numero: numeroNc,
        notaDevolucionId: notaDevolucion.id,
        proveedorId: notaDevolucion.proveedorId,
        fecha: fecha || new Date().toISOString().slice(0, 10),
        monto: m,
      };
      setNotasCreditoProveedor((prev) => [nc, ...prev]);
      agregarAsiento(
        LABELS.asientoNC,
        `NC recibida ${nc.numero} por devolución ${notaDevolucion.numero}`,
        m,
        { notaCreditoId: ncId, notaDevolucionId: notaDevolucion.id },
      );
      return { ok: true, notaCredito: nc };
    },
    [agregarAsiento],
  );

  const registrarOrdenPago = useCallback((payload) => {
    const { proveedorId, facturaIds, medios, fecha } = payload;
    if (!facturaIds?.length) return { ok: false, error: 'Seleccioná al menos una factura.' };
    const opId = nid();
    const numero = fmtOp(opSeqRef.current++);
    const totalMedios = (medios ?? []).reduce((a, m) => a + (Number(m.monto) || 0), 0);
    const op = {
      id: opId,
      numero,
      proveedorId,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      facturaIds: [...facturaIds],
      medios: medios ?? [],
      total: totalMedios,
      estado: 'Registrada',
    };
    setOrdenesPagoProveedores((prev) => [op, ...prev]);
    setFacturasProveedor((prev) =>
      prev.map((f) => (facturaIds.includes(f.id) ? { ...f, estadoPago: 'Pagada' } : f)),
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
