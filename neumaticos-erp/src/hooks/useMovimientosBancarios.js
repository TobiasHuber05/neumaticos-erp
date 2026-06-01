import { useCallback, useEffect, useState } from 'react';

const API = '/api/movimientos-bancarios';

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
    };
}

export function useMovimientosBancarios(enabled = true) {
    const [movimientos, setMovimientos] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMovimientos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(API, { headers: getHeaders() });
            const data = await res.json();
            setMovimientos(data);
        } catch (err) {
            setError('Error al cargar movimientos');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API}/estadisticas`, { headers: getHeaders() });
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Error al cargar estadísticas');
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;
        fetchMovimientos();
        fetchStats();
    }, [fetchMovimientos, fetchStats]);

    const registrarMovimiento = useCallback(async (payload) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ ...payload, es_manual: true })
            });

            if (!res.ok) {
                const err = await res.json();
                return { ok: false, error: err.error };
            }

            const data = await res.json();
            setMovimientos(prev => [data, ...prev]);
            fetchStats(); // Actualizar estadísticas
            return { ok: true, movimiento: data };
        } catch (err) {
            return { ok: false, error: 'Error al conectar con el servidor' };
        }
    }, [fetchStats]);

    const confirmarMovimientos = useCallback(async (movimientoIds) => {
        try {
            const res = await fetch(`${API}/confirmar`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ movimientoIds })
            });

            if (!res.ok) {
                const err = await res.json();
                return { ok: false, error: err.error };
            }

            await fetchMovimientos();
            await fetchStats();
            return { ok: true };
        } catch (err) {
            return { ok: false, error: 'Error al confirmar movimientos' };
        }
    }, [fetchMovimientos, fetchStats]);

    return {
        movimientos,
        stats,
        loading,
        error,
        registrarMovimiento,
        confirmarMovimientos,
        refetch: fetchMovimientos,
        refetchStats: fetchStats
    };
}
