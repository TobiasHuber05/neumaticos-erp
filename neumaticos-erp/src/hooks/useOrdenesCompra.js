// src/hooks/useOrdenesCompra.js

import { useCallback, useEffect, useState } from 'react';
import { validarFacturaContraOrden } from '../utils/comprasLogic';

const API = '/api/ordenes-compra';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
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
      if (!res.ok) throw new Error('Error al cargar órdenes');
      const data = await res.json();
      setOrdenesCompra(data);
    } catch {
      setError('Error al cargar órdenes de compra');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFacturas = useCallback(async () => {
    try {
      const res = await fetch(`${API}/facturas`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al cargar facturas');
      const data = await res.json();
      setFacturasProveedor(data);
    } catch {
      console.error('Error al cargar facturas');
    }
  }, []);

  useEffect(() => {
    fetchOrdenes();
    fetchFacturas();
  }, [fetchOrdenes, fetchFacturas]);

  const registrarFacturaYStock = useCallback(async (ordenCompra, payload) => {
    const { numero, timbrado, fecha, lineas } = payload;

    const val = validarFacturaContraOrden(ordenCompra, lineas, facturasProveedor);
    if (!val.ok) {
      return { ok: false, errores: val.errores };
    }

    try {
      const res = await fetch(`${API}/${ordenCompra.id}/factura`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ numero, timbrado, fecha, lineas }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { ok: false, errores: data.errores ?? [data.error ?? 'Error al registrar la factura'] };
      }

      setFacturasProveedor((prev) => [data.factura, ...prev]);
      await fetchOrdenes();
      await fetchFacturas();

      return { ok: true, factura: data.factura };
    } catch {
      return { ok: false, errores: ['Error al registrar la factura'] };
    }
  }, [fetchOrdenes, fetchFacturas, facturasProveedor]);

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
