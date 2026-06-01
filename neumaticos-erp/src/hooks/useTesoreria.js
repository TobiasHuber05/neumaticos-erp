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
    const [cuentas, setCuentas] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [monedas, setMonedas] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
            const res = await fetch(`${API}/cuentas`, { headers: getHeaders() });
            const data = await res.json();
            setCuentas(data);
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
            setCuentas((prev) => [...prev, nueva]);
            return { ok: true, cuenta: nueva };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }, []);

    return {
        cuentas,
        bancos,
        monedas,
        loading,
        error,
        registrarCuenta,
        refetchCuentas: fetchCuentas,
    };
}