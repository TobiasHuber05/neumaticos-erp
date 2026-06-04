// src/hooks/usePlanCuentas.js

import { useCallback, useEffect, useState } from 'react';

const API = '/api/contabilidad';

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
    };
}

export function usePlanCuentas() {
    const [cuentas, setCuentas] = useState([]);
    const [periodos, setPeriodos] = useState([]);
    const [periodoActivo, setPeriodoActivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPeriodos = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/periodos-contables`, { headers: getHeaders() });
            const data = await res.json();
            setPeriodos(data);
            
            const abierto = data.find((p) => p.estado === 'Abierto');
            if (abierto) {
                const idFinal = abierto.id || abierto.id_proc_contable;
                setPeriodoActivo(idFinal);
            } else if (data.length > 0) {
                const idFinal = data[0].id || data[0].id_proc_contable;
                setPeriodoActivo(idFinal);
            }
        } catch (err) {
            console.error('Error al cargar periodos');
        }
    }, []);

    const fetchCuentas = useCallback(async (idPeriodo) => {
        setLoading(true);
        try {
            const url = idPeriodo
                ? `${API}/plan-cuentas?id_periodo=${idPeriodo}`
                : `${API}/plan-cuentas`;
            const res = await fetch(url, { headers: getHeaders() });
            const data = await res.json();
            setCuentas(data);
        } catch (err) {
            setError('Error al cargar plan de cuentas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPeriodos();
    }, [fetchPeriodos]);

    useEffect(() => {
        fetchCuentas(periodoActivo);
    }, [fetchCuentas, periodoActivo]);

    // Crear cuenta
    const crearCuenta = useCallback(async (data) => {
        const body = {
            ...data,
            id_proc_contable: data.id_proc_contable || periodoActivo
        };

        try {
            const res = await fetch(`${API}/plan-cuentas`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                return { ok: false, error: err.error };
            }

            const nueva = await res.json();
            setCuentas((prev) => [...prev, nueva].sort((a, b) =>
                (a.codigo ?? '').localeCompare(b.codigo ?? '')
            ));
            return { ok: true, cuenta: nueva };
        } catch (err) {
            return { ok: false, error: 'Error al crear cuenta' };
        }
    }, [periodoActivo]);

    // Actualizar cuenta
    const actualizarCuenta = useCallback(async (id, data) => {
        try {
            const res = await fetch(`${API}/plan-cuentas/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const err = await res.json();
                return { ok: false, error: err.error };
            }

            const actualizada = await res.json();
            setCuentas((prev) => prev.map((c) => c.id === id ? actualizada : c));
            return { ok: true, cuenta: actualizada };
        } catch (err) {
            return { ok: false, error: 'Error al actualizar cuenta' };
        }
    }, []);

    // Eliminar cuenta
    const eliminarCuenta = useCallback(async (id) => {
        try {
            const res = await fetch(`${API}/plan-cuentas/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });

            if (!res.ok) {
                const err = await res.json();
                return { ok: false, error: err.error };
            }

            setCuentas((prev) => prev.filter((c) => c.id !== id));
            return { ok: true };
        } catch (err) {
            return { ok: false, error: 'Error al eliminar cuenta' };
        }
    }, []);

    return {
        cuentas,
        periodos,
        periodoActivo,
        setPeriodoActivo,
        loading,
        error,
        crearCuenta,
        actualizarCuenta,
        eliminarCuenta,
        fetchCuentas,
        fetchPeriodos,
        refresh: async () => {
            await fetchPeriodos();
            await fetchCuentas(periodoActivo);
        },
    };
}