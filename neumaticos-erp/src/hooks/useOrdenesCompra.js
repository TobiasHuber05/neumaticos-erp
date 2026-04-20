// src/hooks/useOrdenesCompra.js

import { useCallback, useEffect, useState } from 'react';

const API = '/api/ordenes-compra';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  };
}

export function useOrdenesCompra() {
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [facturasProveedor, setFacturasProveedor] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: getHeaders() });
      const data = await res.json();
      setOrdenesCompra(data);
    } catch (err) {
      setError('Error al cargar órdenes de compra');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFacturas = useCallback(async () => {
    try {
      const res = await fetch(`${API}/facturas`, { headers: getHeaders() });
      const data = await res.json();
      setFacturasProveedor(data);
    } catch (err) {
      console.error('Error al cargar facturas');
    }
  }, []);

  useEffect(() => {
    fetchOrdenes();
    fetchFacturas();
  }, [fetchOrdenes, fetchFacturas]);

  // Registrar factura contra una OC — compatible con registrarFacturaYStock del hook local
  const registrarFacturaYStock = useCallback(async (ordenCompra, payload) => {
    const { numero, timbrado, fecha, lineas } = payload;

    try {
      const res = await fetch(`${API}/${ordenCompra.id}/factura`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ numero, timbrado, fecha, lineas })
      });

      if (!res.ok) {
        const err = await res.json();
        return { ok: false, errores: [err.error] };
      }

      const data = await res.json();

      // Actualizar estado local
      setFacturasProveedor((prev) => [data.factura, ...prev]);
      await fetchOrdenes(); // refrescar estado de OC
      await fetchFacturas(); // refrescar lista de facturas

      return { ok: true, factura: data.factura };
    } catch (err) {
      return { ok: false, errores: ['Error al registrar la factura'] };
    }
  }, [fetchOrdenes]);

  return {
    ordenesCompra,
    facturasProveedor,
    loading,
    error,
    registrarFacturaYStock,
    refetch: fetchOrdenes,
    refetchFacturas: fetchFacturas,
  };
}