import { useState, useEffect } from 'react';
import { calcularSaldosDeCuenta } from '../utils/tesoreriasLogis';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Helper for API requests with JSON handling
const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Error ${response.status}`);
  }
  return response.json();
};

export const useModuloTesoreria = () => {
  // State
  const [cuentas, setCuentas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [conciliaciones, setConciliaciones] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Load all needed data from the backend
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [c, m, co, b, mon] = await Promise.all([
        apiFetch('/api/tesoreria/cuentas'),
        apiFetch('/api/movimientos-bancarios'),
        apiFetch('/api/conciliaciones'),
        apiFetch('/api/tesoreria/bancos'),
        apiFetch('/api/tesoreria/monedas'),
      ]);
      setCuentas(c);
      setMovimientos(m);
      setConciliaciones(co);
      setBancos(b);
      setMonedas(mon);
    } catch (e) {
      console.error('Error cargando datos de tesorería:', e);
    } finally {
      setCargando(false);
    }
  };

  // Initial load
  useEffect(() => {
    cargarDatos();
  }, []);

  // ---------- API actions ----------
  const crearConciliacion = async (payload) => {
    // payload: { id_cuenta, fecha, descripcion, saldo_banco }
    const data = await apiFetch('/api/conciliaciones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // Insert new conciliación at the top of the list (most recent first)
    setConciliaciones((prev) => [data, ...prev]);
    return { ok: true, data };
  };

  // Register new bank account
  const registrarCuenta = async (nuevaCuenta) => {
    const data = await apiFetch('/api/tesoreria/cuentas', {
      method: 'POST',
      body: JSON.stringify(nuevaCuenta),
    });
    // Refresh full data to ensure balances are recomputed
    await cargarDatos();
    return { ok: true, data };
  };

  // Register new manual movement
  const registrarMovimiento = async (nuevoMov) => {
    const data = await apiFetch('/api/movimientos-bancarios', {
      method: 'POST',
      body: JSON.stringify(nuevoMov),
    });
    // Refresh full data to include new movement in calculations
    await cargarDatos();
    return { ok: true, data };
  };

  const vincularMovimientos = async (conciliacionId, movimientoIds) => {
    const data = await apiFetch(`/api/conciliaciones/${conciliacionId}/vincular`, {
      method: 'POST',
      body: JSON.stringify({ movimientoIds }),
    });
    // Refresh data to reflect updated totals
    await cargarDatos();
    return { ok: true, data };
  };

  const finalizarConciliacion = async (conciliacionId) => {
    const data = await apiFetch(`/api/conciliaciones/${conciliacionId}/finalizar`, {
      method: 'PATCH',
    });
    await cargarDatos();
    return { ok: true, data };
  };

  const obtenerDetalleConciliacion = async (id) => {
    return await apiFetch(`/api/conciliaciones/${id}`);
  };

  // ---------- Helper for account balances ----------
  const obtenerEstadoCuenta = (cuentaId) => {
    const cuenta = cuentas.find((c) => c.id_cuenta === cuentaId);
    if (!cuenta) return null;
    const movs = movimientos.filter((m) => m.id_cuenta === cuentaId);
    const { saldoReal, saldoDisponible } = calcularSaldosDeCuenta(
      movs,
      cuenta.saldo_inicial ?? cuenta.saldo ?? 0,
      cuenta.saldo_disponible_inicial ?? cuenta.saldo_disponible ?? 0,
    );
    return { ...cuenta, saldoReal, saldoDisponible };
  };

  return {
    cuentas,
    movimientos,
    conciliaciones,
    bancos,
    monedas,
    obtenerEstadoCuenta,
    registrarCuenta,
    registrarMovimiento,
    crearConciliacion,
    vincularMovimientos,
    finalizarConciliacion,
    obtenerDetalleConciliacion,
    cargarDatos,
    cargando,
  };
};