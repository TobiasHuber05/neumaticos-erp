import { useState, useCallback } from 'react';

const API = '/api/reportes-stock';

export function useReportesStock() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const getMovimientos = useCallback(async (filtros = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filtros.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde);
            if (filtros.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta);
            if (filtros.productoId) queryParams.append('productoId', filtros.productoId);
            if (filtros.tipoMovimiento) queryParams.append('tipoMovimiento', filtros.tipoMovimiento);

            const res = await fetch(`${API}/movimientos?${queryParams.toString()}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al obtener movimientos');
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getKpis = useCallback(async (filtros = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filtros.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde);
            if (filtros.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta);

            const res = await fetch(`${API}/kpis?${queryParams.toString()}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al obtener KPIs');
            return await res.json();
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getProductosLista = useCallback(async () => {
        try {
            const res = await fetch(`${API}/productos-lista`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al obtener productos');
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error(err);
            return [];
        }
    }, []);

    return {
        loading,
        error,
        getMovimientos,
        getKpis,
        getProductosLista,
    };
}
