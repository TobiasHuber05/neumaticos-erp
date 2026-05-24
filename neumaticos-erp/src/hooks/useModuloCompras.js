import { useCallback, useEffect, useState } from 'react';

const API_DEV = '/api/ordenes-compra/devoluciones';
const API_NC = '/api/ordenes-compra/notas-credito';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

export function useModuloCompras() {
  const [notasDevolucion, setNotasDevolucion] = useState([]);
  const [notasCreditoProveedor, setNotasCreditoProveedor] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDevoluciones = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const [resDev, resNc] = await Promise.all([
        fetch(API_DEV, { headers }),
        fetch(API_NC, { headers }),
      ]);

      if (resDev.ok) setNotasDevolucion(await resDev.json());
      if (resNc.ok) setNotasCreditoProveedor(await resNc.json());
    } catch (err) {
      console.error('Error cargando devoluciones/NC:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevoluciones();
  }, [fetchDevoluciones]);

  const registrarNotaDevolucion = useCallback(async (factura, payload) => {
    const { motivo, lineas } = payload;
    try {
      const res = await fetch('/api/ordenes-compra/devolucion', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ facturaId: factura.id, motivo, lineas }),
      });
      if (!res.ok) {
        const errData = await res.json();
        return { ok: false, error: errData.error };
      }
      await fetchDevoluciones();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de conexión' };
    }
  }, [fetchDevoluciones]);

  const registrarNotaCreditoProveedor = useCallback(async (notaDevolucion, payload) => {
    const { numero, monto } = payload;
    try {
      const res = await fetch('/api/ordenes-compra/nota-credito', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ notaDevolucionId: notaDevolucion.id, numero, monto }),
      });
      if (!res.ok) {
        const errData = await res.json();
        return { ok: false, error: errData.error };
      }
      await fetchDevoluciones();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de conexión' };
    }
  }, [fetchDevoluciones]);

  return {
    notasDevolucion,
    notasCreditoProveedor,
    loading,
    registrarNotaDevolucion,
    registrarNotaCreditoProveedor,
    refetch: fetchDevoluciones,
  };
}
