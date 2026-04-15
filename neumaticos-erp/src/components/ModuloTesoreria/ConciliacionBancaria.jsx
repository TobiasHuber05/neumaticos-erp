import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Search, Save } from 'lucide-react';

const ConciliacionBancaria = ({ movimientos, cuentas, onConfirmarConciliacion }) => {
  const [cuentaId, setCuentaId] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);

  // Filtramos los movimientos que NO tienen fecha_confirmacion (Pendientes) 
  // o que no han sido conciliados aún.
  const movimientosPendientes = useMemo(() => {
    if (!cuentaId) return [];
    return movimientos.filter(m => 
      m.id_cuenta === Number(cuentaId) && !m.fecha_confirmacion
    );
  }, [movimientos, cuentaId]);

  const toggleMovimiento = (id) => {
    setSeleccionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGuardar = () => {
    if (seleccionados.length === 0) return;
    // Enviamos los IDs para actualizar su fecha_confirmacion al día de hoy
    onConfirmarConciliacion(seleccionados);
    setSeleccionados([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Conciliación Bancaria</h2>
        
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs font-black text-gray-500 uppercase mb-1">Seleccionar Cuenta</label>
            <select 
              value={cuentaId}
              onChange={(e) => {
                setCuentaId(e.target.value);
                setSeleccionados([]);
              }}
              className="w-full p-2.5 border rounded-lg bg-gray-50"
            >
              <option value="">-- Elige una cuenta para conciliar --</option>
              {cuentas.map(c => (
                <option key={c.id_cuenta} value={c.id_cuenta}>
                  {c.numero_cuenta} ({c.tipo_cuenta})
                </option>
              ))}
            </select>
          </div>
          
          <button
            disabled={seleccionados.length === 0}
            onClick={handleGuardar}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-md"
          >
            <Save size={20} /> Confirmar Selección ({seleccionados.length})
          </button>
        </div>
      </div>

      {!cuentaId ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Search className="mx-auto text-gray-300 mb-2" size={48} />
          <p className="text-gray-500">Selecciona una cuenta para ver los movimientos pendientes de confirmación.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
            <span className="text-sm font-bold text-orange-800 uppercase">Movimientos en tránsito / Pendientes 48hs</span>
            <span className="text-xs text-orange-600 font-medium">Marcá los que ya figuran en tu extracto bancario</span>
          </div>
          
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black">
              <tr>
                <th className="px-6 py-3 w-10"></th>
                <th className="px-4 py-3">Fecha Mov.</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-center">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimientosPendientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 italic">
                    No hay movimientos pendientes para esta cuenta.
                  </td>
                </tr>
              ) : (
                movimientosPendientes.map((m) => (
                  <tr 
                    key={m.id_movimiento} 
                    onClick={() => toggleMovimiento(m.id_movimiento)}
                    className={`cursor-pointer transition-colors ${seleccionados.includes(m.id_movimiento) ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${seleccionados.includes(m.id_movimiento) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                        {seleccionados.includes(m.id_movimiento) && <CheckCircle2 size={14} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.fecha_movimiento}</td>
                    <td className="px-4 py-3 font-bold text-gray-700">{m.concepto}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={m.monto_egreso > 0 ? "text-red-600" : "text-green-600"}>
                        Gs. {(m.monto_ingreso || m.monto_egreso).toLocaleString('de-DE')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <AlertCircle size={10} /> EN TRÁNSITO
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ConciliacionBancaria;