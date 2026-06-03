// src/hooks/useTesoreria.js

import { useCallback, useEffect, useState } from 'react';

const API = '/api/tesoreria';

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
    };
}

export function useTesoreria(enabled = true) {
    const [todasLasCuentas, setTodasLasCuentas] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [monedas, setMonedas] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cuentas = todasLasCuentas.filter((c) => c.activa !== false);
    const cuentasInactivas = todasLasCuentas.filter((c) => c.activa === false);

    const fetchBancos = useCallback(async () => {
        try {
            const res = await fetch(`${API}/bancos`, { headers: getHeaders() });
            const data = await res.json();
            setBancos(data);
        } catch (err) {
            console.error('Error al cargar bancos');
        }
    }, []);

    const fetchMonedas = useCallback(async () => {
        try {
            const res = await fetch(`${API}/monedas`, { headers: getHeaders() });
            const data = await res.json();
            setMonedas(data);
        } catch (err) {
            console.error('Error al cargar monedas');
        }
    }, []);

    const fetchCuentas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/cuentas?incluirInactivas=true`, { headers: getHeaders() });
            const data = await res.json();
            setTodasLasCuentas(data);
        } catch (err) {
            setError('Error al cargar cuentas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;
        fetchBancos();
        fetchMonedas();
        fetchCuentas();
    }, [fetchBancos, fetchMonedas, fetchCuentas]);

    // Crear nueva cuenta bancaria
    const registrarCuenta = useCallback(async (data) => {
        try {
            const res = await fetch(`${API}/cuentas`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error al crear cuenta');
            const nueva = await res.json();
            setTodasLasCuentas((prev) => [...prev, { ...nueva, activa: true }]);
            return { ok: true, cuenta: nueva };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }, []);

    // Eliminar cuenta bancaria (permanente)
    const eliminarCuenta = useCallback(async (id) => {
        try {
            const res = await fetch(`${API}/cuentas/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Error al eliminar cuenta');
            setTodasLasCuentas((prev) => prev.filter((c) => c.id_cuenta !== id));
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }, []);

    // Desactivar cuenta (sacar de la lista)
    const desactivarCuenta = useCallback(async (id) => {
        try {
            const res = await fetch(`${API}/cuentas/${id}/desactivar`, {
                method: 'PUT',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Error al desactivar cuenta');
            setTodasLasCuentas((prev) =>
                prev.map((c) => (c.id_cuenta === id ? { ...c, activa: false } : c))
            );
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }, []);

    // Reactivar cuenta (volver a la lista)
    const reactivarCuenta = useCallback(async (id) => {
        try {
            const res = await fetch(`${API}/cuentas/${id}/reactivar`, {
                method: 'PUT',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Error al reactivar cuenta');
            setTodasLasCuentas((prev) =>
                prev.map((c) => (c.id_cuenta === id ? { ...c, activa: true } : c))
            );
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }, []);

    return {
        cuentas,
        cuentasInactivas,
        todasLasCuentas,
        bancos,
        monedas,
        loading,
        error,
        registrarCuenta,
        eliminarCuenta,
        desactivarCuenta,
        reactivarCuenta,
        refetchCuentas: fetchCuentas,
    };
}