import React, { useMemo, useState } from 'react';
import { X, Save, CheckCircle2, Search } from 'lucide-react';

const ConciliacionBancaria = ({ cuentas = [], movimientos = [], onCancelar, onConfirmarConciliacion }) => {
  const [cuentaId, setCuentaId] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);

  const movimientosPendientes = useMemo(() => {
    if (!cuentaId) return [];
    return movimientos.filter((mov) => mov.id_cuenta === Number(cuentaId) && !mov.fecha_confirmacion);
  }, [movimientos, cuentaId]);

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmar = () => {
    if (!seleccionados.length) return;
    onConfirmarConciliacion(seleccionados);
    setSeleccionados([]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden max-w-4xl mx-auto">
      <div className="bg-erp-orange p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white">
          <CheckCircle2 size={22} />
          <div>
            <h2 className="font-bold text-lg">Conciliación Bancaria</h2>
            <p className="text-[12px] text-orange-100">Confirma movimientos pendientes en el extracto</p>
          </div>
        </div>
        <button type="button" onClick={onCancelar} className="rounded-full p-2 hover:bg-orange-500/30 text-white">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cuenta a conciliar</label>
            <select
              value={cuentaId}
              onChange={(e) => {
                setCuentaId(e.target.value);
                setSeleccionados([]);
              }}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
            >
              <option value="">Seleccionar cuenta</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.id_cuenta} value={cuenta.id_cuenta}>
                  {cuenta.numero_cuenta} — {cuenta.tipo_cuenta}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end">
            <button
              type="button"
              disabled={!seleccionados.length}
              onClick={handleConfirmar}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-erp-orange text-white font-bold disabled:opacity-50 hover:bg-orange-600 transition-colors"
            >
              <Save size={18} /> Confirmar {seleccionados.length || 0}
            </button>
          </div>
        </div>

        {!cuentaId ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-14 text-center text-gray-500">
            <Search size={36} className="mx-auto mb-4" />
            Selecciona una cuenta para ver los movimientos pendientes de conciliación.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-orange-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-black">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Concepto</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3">Estado</th>
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
                  movimientosPendientes.map((mov) => (
                    <tr
                      key={mov.id_movimiento}
                      onClick={() => toggleSeleccion(mov.id_movimiento)}
                      className={`cursor-pointer transition-colors ${seleccionados.includes(mov.id_movimiento) ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${seleccionados.includes(mov.id_movimiento) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                          {seleccionados.includes(mov.id_movimiento) ? '✓' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{mov.fecha_movimiento}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{mov.concepto}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-black">
                        Gs. {((mov.monto_ingreso || mov.monto_egreso) ?? 0).toLocaleString('de-DE')}
                      </td>
                      <td className="px-4 py-3 text-xs uppercase tracking-wider text-amber-700 font-bold">Pendiente</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConciliacionBancaria;
