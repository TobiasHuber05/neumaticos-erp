import { useState, useEffect, useCallback } from 'react';

const API_URL = '/api/productos';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const useServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchServicios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al cargar servicios');
      const data = await res.json();
      // Filtrar solo los que son servicios
      const filtered = data.filter((p) => p.esServicio === true);
      setServicios(filtered);
    } catch (err) {
      console.error('❌ Error en fetchServicios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  const agregarServicio = useCallback(async (datos) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...datos,
          esServicio: true,
          // Limpiar precio de puntos si vienen del form
          precio: String(datos.precio).replace(/\./g, '').replace(/,/g, ''),
        }),
      });
      if (!res.ok) throw new Error('Error al agregar servicio');
      await fetchServicios();
    } catch (err) {
      console.error('❌ Error en agregarServicio:', err);
    }
  }, [fetchServicios]);

  const actualizarServicio = useCallback(async (id, datos) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          ...datos,
          esServicio: true,
          precio: String(datos.precio).replace(/\./g, '').replace(/,/g, ''),
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar servicio');
      }
      await fetchServicios();
      return { ok: true };
    } catch (err) {
      console.error('❌ Error en actualizarServicio:', err);
      return { ok: false, error: err.message };
    }
  }, [fetchServicios]);

  const eliminarServicio = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar servicio');
      }
      await fetchServicios();
      return { ok: true };
    } catch (err) {
      console.error('❌ Error en eliminarServicio:', err);
      return { ok: false, error: err.message };
    }
  }, [fetchServicios]);

  return {
    servicios,
    loading,
    refetch: fetchServicios,
    actions: {
      agregarServicio,
      actualizarServicio,
      eliminarServicio,
    }
  };
};
