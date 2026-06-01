import { useState, useEffect } from 'react';

const API = '/api/conciliaciones';

export function useConciliaciones(enabled = true) {
    const [conciliaciones, setConciliaciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    const fetchConciliaciones = async () => {
        setLoading(true);
        try {
            const res = await fetch(API, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al cargar conciliaciones');
            const data = await res.json();
            setConciliaciones(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const crearConciliacion = async (payload) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { ok: false, error: data.error };

            await fetchConciliaciones();
            return { ok: true, data };
        } catch (err) {
            return { ok: false, error: 'Error de red' };
        }
    };

    const vincularMovimientos = async (id, movimientoIds) => {
        try {
            const res = await fetch(`${API}/${id}/vincular`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ movimientoIds })
            });
            if (!res.ok) throw new Error('Error al vincular movimientos');
            await fetchConciliaciones();
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    };

    const finalizarConciliacion = async (id) => {
        try {
            const res = await fetch(`${API}/${id}/finalizar`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Error al finalizar conciliación');
            await fetchConciliaciones();
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    };

    const getConciliacionById = async (id) => {
        try {
            const res = await fetch(`${API}/${id}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al cargar detalle');
            return await res.json();
        } catch (err) {
            return null;
        }
    };

    useEffect(() => {
        if (!enabled) return;
        fetchConciliaciones();
    }, []);

    return {
        conciliaciones,
        loading,
        error,
        crearConciliacion,
        vincularMovimientos,
        finalizarConciliacion,
        getConciliacionById,
        refetch: fetchConciliaciones
    };
}
