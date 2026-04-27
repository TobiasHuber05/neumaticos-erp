import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3000/api/asientos-contables';

export function useAsientosContables(idPeriodo) {
    const [asientos, setAsientos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const fetchAsientos = useCallback(async () => {
        setLoading(true);
        try {
            const url = idPeriodo ? `${API}?periodo=${idPeriodo}` : API;
            const res = await fetch(url, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al cargar asientos');
            const data = await res.json();
            setAsientos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [idPeriodo]);

    useEffect(() => {
        fetchAsientos();
    }, [fetchAsientos]);

    const crearAsiento = async (datos) => {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    ...datos,
                    id_proc_contable: idPeriodo
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear asiento');
            
            await fetchAsientos();
            return { ok: true, data };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    };

    return {
        asientos,
        loading,
        error,
        crearAsiento,
        refresh: fetchAsientos
    };
}
