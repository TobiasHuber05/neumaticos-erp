// src/hooks/usePagosProveedores.js

import { useCallback, useEffect, useState } from 'react';

const API = '/api/pagos-proveedores';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  };
}

export function usePagosProveedores() {
  const [ordenesPagoProveedores, setOrdenesPagoProveedores] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: getHeaders() });
      const data = await res.json();
      setOrdenesPagoProveedores(data);
    } catch (err) {
      setError('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFormasPago = useCallback(async () => {
    try {
      const res = await fetch(`${API}/formas-pago`, { headers: getHeaders() });
      const data = await res.json();
      // Devolver solo los nombres para compatibilidad con el frontend
      setMediosPago(data.map((f) => f.nombre));
    } catch (err) {
      console.error('Error al cargar formas de pago');
    }
  }, []);

  useEffect(() => {
    fetchPagos();
    fetchFormasPago();
  }, [fetchPagos, fetchFormasPago]);

  const registrarOrdenPago = useCallback(async (payload) => {
    const { proveedorId, facturaIds, medios, fecha } = payload;

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ proveedorId, facturaIds, medios, fecha })
      });

      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.error };
      }

      const data = await res.json();
      setOrdenesPagoProveedores((prev) => [data.ordenPago, ...prev]);
      return { ok: true, ordenPago: data.ordenPago };
    } catch (err) {
      return { ok: false, error: 'Error al registrar el pago' };
    }
  }, []);

  return {
    ordenesPagoProveedores,
    mediosPago,
    loading,
    error,
    registrarOrdenPago,
    refetch: fetchPagos,
  };
}