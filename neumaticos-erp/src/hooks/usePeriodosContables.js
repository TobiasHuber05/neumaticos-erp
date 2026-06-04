import { useState, useEffect, useCallback } from 'react';

const API = `${import.meta.env.VITE_API_URL || ''}/api/periodos-contables`;

export function usePeriodosContables() {
    const [periodos, setPeriodos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const fetchPeriodos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(API, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al cargar periodos contables');
            const data = await res.json();
            setPeriodos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPeriodos();
    }, [fetchPeriodos]);

    const crearPeriodo = async (datos) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(datos)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear periodo');
            
            await fetchPeriodos();
            return { ok: true, data };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    };

    const cerrarPeriodo = async (id) => {
        try {
            const res = await fetch(`${API}/${id}/cerrar`, {
                method: 'PUT',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cerrar periodo');
            
            await fetchPeriodos();
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    };

    return {
        periodos,
        loading,
        error,
        crearPeriodo,
        cerrarPeriodo,
        refresh: fetchPeriodos
    };
}
