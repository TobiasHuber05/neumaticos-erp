import React, { useEffect, useState } from 'react';
import { BookMarked } from 'lucide-react';

const AsientosCompras = () => {
  const [asientos, setAsientos] = useState([]);

  useEffect(() => {
     // BORRA ESTA:
    //fetch('http://localhost:3000/api/asientos-compras')
   
  // PEGA ESTA:
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/asientos-compras`)
      .then(res => res.json())
      .then(data => setAsientos(data))
      .catch(err => console.error("Error:", err));
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-orange-100">
      <div className="flex items-center gap-2 mb-6">
        <BookMarked className="text-orange-500" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Libro Diario de Compras</h2>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-orange-50 text-orange-600 uppercase text-xs font-bold">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Descripción</th>
            <th className="px-4 py-3 text-right">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {asientos.map(a => (
            <tr key={a.id_asiento} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono font-bold">#{a.id_asiento}</td>
              <td className="px-4 py-3">{new Date(a.fecha).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-gray-600">{a.descripcion}</td>
              <td className="px-4 py-3 text-right font-bold text-orange-700">
                Gs. {Number(a.total_debe).toLocaleString('de-DE')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AsientosCompras;