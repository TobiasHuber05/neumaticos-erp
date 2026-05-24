import { useEffect, useState } from 'react';
import { BookMarked, Loader2 } from 'lucide-react';

function getHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

const AsientosCompras = () => {
  const [asientos, setAsientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/asientos-compras', { headers: getHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudieron cargar los asientos');
        return res.json();
      })
      .then((data) => {
        setAsientos(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-orange-100">
      <div className="flex items-center gap-2 mb-6">
        <BookMarked className="text-orange-500" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Libro Diario de Compras</h2>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          Cargando asientos...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm p-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <table className="w-full text-sm text-left">
          <thead className="bg-orange-50 text-orange-600 uppercase text-xs font-bold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {asientos.map((a) => (
              <tr key={a.id_asiento} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold">#{a.id_asiento}</td>
                <td className="px-4 py-3">{new Date(a.fecha).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-600">{a.descripcion}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{a.tabla_origen ?? '—'}</td>
                <td className="px-4 py-3 text-right font-bold text-orange-700">
                  Gs. {Number(a.total_debe).toLocaleString('de-DE')}
                </td>
              </tr>
            ))}
            {!asientos.length && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  No hay asientos de compras registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AsientosCompras;
