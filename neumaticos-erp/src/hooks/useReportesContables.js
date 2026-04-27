import { useState, useCallback } from 'react';

const API = 'http://localhost:3000/api/reportes-contables';

export function useReportesContables() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const getLibroDiario = useCallback(async (periodoId) => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/libro-diario?periodo=${periodoId}`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getLibroMayor = useCallback(async (periodoId, cuentaId) => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/libro-mayor?periodo=${periodoId}&cuenta=${cuentaId}`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getSumasSaldos = useCallback(async (periodoId) => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/sumas-saldos?periodo=${periodoId}`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getLibroDiario,
        getLibroMayor,
        getSumasSaldos
    };
}
