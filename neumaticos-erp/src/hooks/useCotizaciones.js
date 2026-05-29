// src/hooks/useCotizaciones.js

import { useCallback, useEffect, useState } from 'react';

const API = '/api/cotizaciones';

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

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

export function useCotizaciones() {
  const [cotizacionesProveedor, setCotizacionesProveedor] = useState([]);
  const [pedidosCotizacion, setPedidosCotizacion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCotizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: getHeaders() });
      const data = await res.json();

      const grupos = {};
      data.forEach((c) => {
        const key = c.idPedidoProducto;
        if (!grupos[key]) {
          grupos[key] = {
            id: key,
            pedidoCompraId: key,
            fechaEnvio: c.fecha,
            estado: 'Pendiente',
            proveedorIds: [],
          };
        }
        grupos[key].proveedorIds.push(c.proveedor?.id);
        if (c.estado === 'Adjudicado') grupos[key].estado = 'Adjudicado';
        else if (c.estado === 'Respondido' && grupos[key].estado !== 'Adjudicado') {
          grupos[key].estado = 'Enviado';
        }
      });

      setPedidosCotizacion(Object.values(grupos));

      const cotsNormalizadas = data.map((c) => ({
        id: c.id,
        pedidoCotizacionId: c.idPedidoProducto,
        proveedorId: c.proveedor?.id,
        fechaRespuesta: null,
        estado: c.estado === 'Adjudicado'
          ? 'Adjudicado'
          : c.estado === 'Respondido' || c.lineas.some((l) => l.precio != null && Number(l.precio) > 0)
            ? 'Respondido'
            : 'Pendiente',
        lineas: c.lineas.map((l) => ({
          productoId: l.productoId,
          nombreProducto: l.nombreProducto,
          cantidadSolicitada: l.cantidadSolicitada,
          precioUnitario: l.precio != null ? String(l.precio) : '',
          idDetalle: l.id,
        })),
      }));
      setCotizacionesProveedor(cotsNormalizadas);
    } catch {
      setError('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCotizaciones();
  }, [fetchCotizaciones]);

  const generarCotizacion = useCallback(async (pedido, proveedores) => {
    try {
      const categoriasNecesarias = [
        ...new Set(
          (pedido.items ?? [])
            .map((i) => i.categoria)
            .filter((c) => c && c.trim() !== ''),
        ),
      ];

      let provsFiltrados;
      if (!categoriasNecesarias || categoriasNecesarias.length === 0) {
        provsFiltrados = proveedores;
      } else {
        provsFiltrados = proveedores.filter((p) =>
          (p.categorias ?? []).some((c) =>
            categoriasNecesarias.some((cn) => categoriasCompatibles(c, cn)),
          ),
        );
      }

      if (provsFiltrados.length === 0) {
        return { ok: false, error: 'No hay proveedores con las categorías de los productos pedidos.' };
      }

      if (provsFiltrados.length < 3) {
        return {
          ok: false,
          error: `Se requieren al menos 3 proveedores con categorías compatibles. Actualmente hay ${provsFiltrados.length}.`,
        };
      }

      const res = await fetch(`${API}/generar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          idPedidoProducto: pedido.idDB ?? pedido.id,
          proveedorIds: provsFiltrados.map((p) => p.id),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.error };
      }

      await fetchCotizaciones();

      return {
        ok: true,
        advertencia: null,
        pedidoCot: {
          id: pedido.idDB ?? pedido.id,
          numero: pedido.numero,
          proveedorIds: provsFiltrados.map((p) => p.id),
        },
      };
    } catch {
      return { ok: false, error: 'Error al generar cotización' };
    }
  }, [fetchCotizaciones]);

  const actualizarCotizacionProveedor = useCallback(async (cotizacionId, lineas, fechaRespuesta) => {
    try {
      const lineasPayload = lineas.map((l) => ({
        id: l.idDetalle,
        precio: l.precioUnitario !== '' ? Number(l.precioUnitario) : null,
      }));

      const res = await fetch(`${API}/${cotizacionId}/precios`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ lineas: lineasPayload, fechaRespuesta }),
      });

      if (!res.ok) throw new Error('Error al actualizar precios');

      await fetchCotizaciones();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [fetchCotizaciones]);

  const adjudicarYGenerarOrdenes = useCallback(async (pedidoCotizacion) => {
    try {
      const res = await fetch(`${API}/adjudicar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ idPedidoProducto: pedidoCotizacion.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.error };
      }

      const data = await res.json();
      await fetchCotizaciones();

      const ordenes = data.adjudicaciones.map((a) => ({
        proveedorId: a.proveedorId,
        nombreProveedor: a.nombreProveedor,
      }));
      const ordenesUnicas = [...new Map(ordenes.map((o) => [o.proveedorId, o])).values()];

      return { ok: true, ordenes: ordenesUnicas.length ? ordenesUnicas : data.ordenes ?? [] };
    } catch {
      return { ok: false, error: 'Error al adjudicar' };
    }
  }, [fetchCotizaciones]);

  return {
    cotizacionesProveedor,
    pedidosCotizacion,
    loading,
    error,
    generarCotizacion,
    actualizarCotizacionProveedor,
    adjudicarYGenerarOrdenes,
    refetch: fetchCotizaciones,
  };
}
