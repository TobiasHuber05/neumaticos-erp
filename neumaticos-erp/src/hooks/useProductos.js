import { useCallback, useEffect, useState } from 'react';

const API = '/api/productos';

// Función para obtener headers con el token actualizado
function getHeaders() {
  const token = localStorage.getItem('token');
  console.log("🔍 Token recuperado del storage:", token); // Si sale null, el error está en el Login
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

function formatPrecioGs(valor) {
  const n = Number(valor);
  // Si es 0 o no es un número válido, devolvemos 0 formateado o raya
  if (isNaN(n)) return '—';
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
      const headers = getHeaders();

      // Ejecutamos las 3 peticiones en paralelo
      const [resProd, resCat, resMarc] = await Promise.all([
        fetch(API, { headers }),
        fetch(`${API}/categorias`, { headers }),
        fetch(`${API}/marcas`, { headers })
      ]);

      // Validamos si alguna respuesta dio error de autenticación (401/403)
      if (resProd.status === 401 || resCat.status === 401 || resMarc.status === 401) {
        console.error("Sesión expirada o token inválido");
        return;
      }

      const [dataProd, dataCat, dataMarc] = await Promise.all([
        resProd.json(),
        resCat.json(),
        resMarc.json()
      ]);

      // Verificamos que los datos sean arrays antes de setearlos para evitar errores de .map
      setInventario(Array.isArray(dataProd) ? dataProd.map(p => ({
        ...p,
        precioFormateado: formatPrecioGs(p.precio),
        precioNum: p.precio ?? 0,
      })) : []);

      setCategorias(Array.isArray(dataCat) ? dataCat : []);
      setMarcas(Array.isArray(dataMarc) ? dataMarc : []);

    } catch (err) {
      console.error('❌ Error crítico en useProductos:', err);
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear producto');
      }

      await fetchData(); // Recargar todo para asegurar consistencia
      return { ok: true };
    } catch (err) {
      console.error("Error en crearProducto:", err);
      return { ok: false, error: err.message };
    }
  };

  const eliminarProducto = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar producto');
      }
      await fetchData();
      return { ok: true };
    } catch (err) {
      console.error("Error en eliminarProducto:", err);
      return { ok: false, error: err.message };
    }
  };

  return { 
    inventario, 
    categorias, 
    marcas, 
    loading, 
    crearProducto, 
    eliminarProducto,
    refetch: fetchData 
  };
}