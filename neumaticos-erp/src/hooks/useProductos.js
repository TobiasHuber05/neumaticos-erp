import { useCallback, useEffect, useState } from 'react';

const API = '/api/productos';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  };
}

function formatPrecioGs(valor) {
  const n = Number(valor);
  if (!valor || !Number.isFinite(n) || n <= 0) return '—';
  return n.toLocaleString('de-DE');
}

export function useProductos() {
  const [inventario, setInventario] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resProd, resCat, resMarc] = await Promise.all([
        fetch(API, { headers: getHeaders() }),
        fetch(`${API}/categorias`, { headers: getHeaders() }),
        fetch(`${API}/marcas`, { headers: getHeaders() })
      ]);

      const [dataProd, dataCat, dataMarc] = await Promise.all([
        resProd.json(),
        resCat.json(),
        resMarc.json()
      ]);

      setInventario(dataProd.map(p => ({
        ...p,
        precio: formatPrecioGs(p.precio),
        precioNum: p.precio ?? 0,
      })));
      setCategorias(dataCat);
      setMarcas(dataMarc);
    } catch (err) {
      console.error('Error cargando datos de productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const crearProducto = async (datos) => {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(datos)
      });
      if (!res.ok) throw new Error('Error en el servidor');
      await fetchData(); // Recargar lista
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  return { inventario, categorias, marcas, loading, crearProducto, refetch: fetchData };
}