import { useState, useCallback } from 'react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reportes-ventas`;

export function useReportesVentas() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    const getFacturas = useCallback(async (filtros = {}) => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            if (filtros.fechaDesde) q.append('fechaDesde', filtros.fechaDesde);
            if (filtros.fechaHasta) q.append('fechaHasta', filtros.fechaHasta);
            if (filtros.clienteId) q.append('clienteId', filtros.clienteId);
            if (filtros.estadoCobro) q.append('estadoCobro', filtros.estadoCobro);

            const res = await fetch(`${API}/facturas?${q.toString()}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al obtener facturas');
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
            const q = new URLSearchParams();
            if (filtros.fechaDesde) q.append('fechaDesde', filtros.fechaDesde);
            if (filtros.fechaHasta) q.append('fechaHasta', filtros.fechaHasta);
            if (filtros.clienteId) q.append('clienteId', filtros.clienteId);

            const res = await fetch(`${API}/kpis?${q.toString()}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al obtener KPIs');
            return await res.json();
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getClientesLista = useCallback(async () => {
        try {
            const res = await fetch(`${API}/clientes-lista`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al obtener clientes');
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error(err);
            return [];
        }
    }, []);

    return { loading, error, getFacturas, getKpis, getClientesLista };
}
