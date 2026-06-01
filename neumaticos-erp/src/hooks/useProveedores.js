// src/hooks/useProveedores.js
// Reemplaza el estado local de proveedores en useModuloCompras

import { useCallback, useEffect, useState } from 'react';

const API = '/api/proveedores';

function getToken() {
  return localStorage.getItem('token');
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  };
}

export function useProveedores(enabled = true) {
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar proveedores
  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: headers() });
      const data = await res.json();
      setProveedores(data);
    } catch (err) {
      setError('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar categorías disponibles
  const fetchCategorias = useCallback(async () => {
    try {
      const res = await fetch(`${API}/categorias`, { headers: headers() });
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error('Error al cargar categorías');
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchProveedores();
    fetchCategorias();
  }, [fetchProveedores, fetchCategorias]);

  // Crear proveedor
  const crearProveedor = useCallback(async (data) => {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Error al crear proveedor');
      const nuevo = await res.json();
      setProveedores((prev) => [...prev, nuevo]);
      return { ok: true, data: nuevo };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  // Actualizar proveedor
  const actualizarProveedor = useCallback(async (id, data) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Error al actualizar proveedor');
      const actualizado = await res.json();
      setProveedores((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
      return { ok: true, data: actualizado };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  // Eliminar proveedor
  const eliminarProveedor = useCallback(async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: headers()
      });
      if (!res.ok) throw new Error('Error al eliminar proveedor');
      setProveedores((prev) => prev.filter((p) => p.id !== id));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  return {
    proveedores,
    setProveedores,
    categorias,
    loading,
    error,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    refetch: fetchProveedores
  };
}