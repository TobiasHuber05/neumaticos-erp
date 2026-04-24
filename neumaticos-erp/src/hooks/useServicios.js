import { useState, useEffect, useCallback } from 'react';
import { serviciosIniciales } from '../data/erpInitialServices';

export const useServicios = () => {
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    // Simulando carga de API
    setServicios(serviciosIniciales);
  }, []);

  const agregarServicio = useCallback((nuevoServicio) => {
    setServicios((prev) => {
      const nextId = (prev.length ? Math.max(...prev.map((s) => Number(s.id) || 0)) : 0) + 1;
      const servicioFinal = {
        ...nuevoServicio,
        id: nextId,
        estado: nuevoServicio.estado || 'Disponible'
      };
      return [...prev, servicioFinal];
    });
  }, []);

  const actualizarServicio = useCallback((id, datosActualizados) => {
    setServicios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...datosActualizados } : s))
    );
  }, []);

  const eliminarServicio = useCallback((id) => {
    setServicios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    servicios,
    actions: {
      agregarServicio,
      actualizarServicio,
      eliminarServicio,
    }
  };
};
