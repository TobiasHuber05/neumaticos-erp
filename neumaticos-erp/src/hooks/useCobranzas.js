import { useCallback, useEffect, useState } from 'react';

const API = '/api/cobranzas';
const API_FORMAS = '/api/pagos-proveedores/formas-pago';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

export function useCobranzas(enabled = true) {
  const [cobranzas, setCobranzas] = useState([]);
  const [mediosCobro, setMediosCobro] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCobranzas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: getHeaders() });
      if (res.ok) setCobranzas(await res.json());
    } catch {
      console.error('Error al cargar cobranzas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFormasCobro = useCallback(async () => {
    try {
      const res = await fetch(API_FORMAS, { headers: getHeaders() });
      const data = await res.json();
      setMediosCobro(
        data
          .map((f) => f.nombre)
          .filter((n) => n && n !== 'Nota de crédito'),
      );
    } catch {
      setMediosCobro(['Efectivo', 'Cheque', 'Transferencia bancaria', 'Otro']);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchCobranzas();
    fetchFormasCobro();
  }, [fetchCobranzas, fetchFormasCobro]);

  const registrarCobro = useCallback(
    async (payload) => {
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          return { ok: false, error: err.error };
        }
        const data = await res.json();
        await fetchCobranzas();
        return { ok: true, cobranza: data.cobranza };
      } catch {
        return { ok: false, error: 'Error al registrar el cobro' };
      }
    },
    [fetchCobranzas],
  );

  return {
    cobranzas,
    mediosCobro,
    loading,
    registrarCobro,
    refetch: fetchCobranzas,
  };
}
