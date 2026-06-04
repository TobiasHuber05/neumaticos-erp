import { useState, useCallback } from 'react';

const API = `${import.meta.env.VITE_API_URL || ''}/api/reportes-compras`;

export function useReportesCompras() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const getOrdenes = useCallback(async (filtros = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filtros.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde);
            if (filtros.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta);
            if (filtros.proveedorId) queryParams.append('proveedorId', filtros.proveedorId);
            if (filtros.estadoPago) queryParams.append('estadoPago', filtros.estadoPago);

            const res = await fetch(`${API}/ordenes?${queryParams.toString()}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al obtener órdenes');
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
            if (filtros.proveedorId) queryParams.append('proveedorId', filtros.proveedorId);

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

    const getProveedoresLista = useCallback(async () => {
        try {
            const res = await fetch(`${API}/proveedores-lista`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al obtener proveedores');
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
        getOrdenes,
        getKpis,
        getProveedoresLista
    };
}
