// src/hooks/useCotizaciones.js

import { useCallback, useEffect, useState } from 'react';

const API = '/api/cotizaciones';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
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

      // Agrupar por idPedidoProducto para armar pedidosCotizacion
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
      });

      setPedidosCotizacion(Object.values(grupos));

      const cotsNormalizadas = data.map((c) => ({
        id: c.id,
        pedidoCotizacionId: c.idPedidoProducto,
        proveedorId: c.proveedor?.id,
        fechaRespuesta: null,
        estado: c.lineas.some((l) => l.precio != null) ? 'Recibida' : 'Pendiente',
        lineas: c.lineas.map((l) => ({
          productoId: l.productoId,
          nombreProducto: l.nombreProducto,
          cantidadSolicitada: l.cantidadSolicitada, // Usar cantidad real del backend
          precioUnitario: l.precio != null ? String(l.precio) : '',
          idDetalle: l.id,
        })),
      }));
      setCotizacionesProveedor(cotsNormalizadas);
    } catch (err) {
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
      // Obtener categorías del pedido, ignorando vacíos
      const categoriasNecesarias = [
        ...new Set(
          (pedido.items ?? [])
            .map((i) => i.categoria)
            .filter((c) => c && c.trim() !== '')
        )
      ];

      let provsFiltrados;

      // Si no hay categorías definidas → enviar a todos los proveedores
      if (!categoriasNecesarias || categoriasNecesarias.length === 0) {
        provsFiltrados = proveedores;
      } else {
        provsFiltrados = proveedores.filter((p) =>
          (p.categorias ?? []).some((c) =>
            categoriasNecesarias.some(
              (cn) => cn.toLowerCase().trim() === c.toLowerCase().trim()
            )
          )
        );
      }

      if (provsFiltrados.length === 0) {
        return { ok: false, error: 'No hay proveedores con las categorías de los productos pedidos.' };
      }

      const advertencia = provsFiltrados.length < 3
        ? `Solo se encontraron ${provsFiltrados.length} proveedor(es) con las categorías requeridas (objetivo: al menos 3).`
        : null;

      const res = await fetch(`${API}/generar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          idPedidoProducto: pedido.idDB,
          proveedorIds: provsFiltrados.map((p) => p.id),
        })
      });

      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.error };
      }

      await fetchCotizaciones();

      return {
        ok: true,
        advertencia,
        pedidoCot: {
          id: pedido.idDB,
          numero: pedido.numero,
          proveedorIds: provsFiltrados.map((p) => p.id),
        }
      };
    } catch (err) {
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
        body: JSON.stringify({ lineas: lineasPayload, fechaRespuesta })
      });

      if (!res.ok) throw new Error('Error al actualizar precios');

      setCotizacionesProveedor((prev) =>
        prev.map((c) =>
          c.id === cotizacionId
            ? { ...c, lineas, fechaRespuesta, estado: 'Recibida' }
            : c
        )
      );

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const adjudicarYGenerarOrdenes = useCallback(async (pedidoCotizacion) => {
    try {
      const res = await fetch(`${API}/adjudicar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ idPedidoProducto: pedidoCotizacion.id })
      });

      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.error };
      }

      const data = await res.json();

      setPedidosCotizacion((prev) =>
        prev.map((p) => (p.id === pedidoCotizacion.id ? { ...p, estado: 'Adjudicado' } : p))
      );

      const ordenes = data.adjudicaciones.map((a) => ({
        proveedorId: a.proveedorId,
        nombreProveedor: a.nombreProveedor,
      }));
      const ordenesUnicas = [...new Map(ordenes.map((o) => [o.proveedorId, o])).values()];

      return { ok: true, ordenes: ordenesUnicas };
    } catch (err) {
      return { ok: false, error: 'Error al adjudicar' };
    }
  }, []);

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