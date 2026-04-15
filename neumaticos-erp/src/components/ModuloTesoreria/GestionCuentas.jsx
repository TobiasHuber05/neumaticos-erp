import React, { useState } from 'react';
import { Landmark, Wallet, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react';
import { calcularSaldosDeCuenta } from '../../utils/tesoreriasLogis';

const GestionCuentas = ({ bancos, cuentas, movimientos, onNuevaCuenta }) => {
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);

  const nombreBanco = (id) => bancos.find((b) => b.id_banco === id)?.nombre ?? 'Banco Desconocido';

  return (
    <div className="space-y-6">
      {/* Encabezado con Acción */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cuentas Bancarias</h2>
          <p className="text-gray-500 text-sm">Administra tus saldos y cuentas en el sistema financiero</p>
        </div>
        <button
          onClick={onNuevaCuenta}
          className="flex items-center gap-2 bg-erp-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus size={20} /> Nueva Cuenta
        </button>
      </div>

      {/* Grid de Tarjetas de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cuentas.map((cta) => {
          // Usamos la lógica para obtener saldos dinámicos
          const movsDeEstaCuenta = movimientos.filter(m => m.id_cuenta === cta.id_cuenta);
          const { saldoReal, saldoDisponible } = calcularSaldosDeCuenta(movsDeEstaCuenta);

          return (
            <div
              key={cta.id_cuenta}
              onClick={() => setCuentaSeleccionada(cta.id_cuenta)}
              className={`cursor-pointer p-5 rounded-2xl border-2 transition-all shadow-sm
                ${cuentaSeleccionada === cta.id_cuenta 
                  ? 'border-erp-orange bg-orange-50 shadow-md' 
                  : 'border-gray-100 bg-white hover:border-orange-200'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-erp-yellow/20 rounded-lg text-erp-orange">
                  <Landmark size={24} />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {cta.tipo_cuenta}
                </span>
              </div>

              <h3 className="font-bold text-gray-800">{nombreBanco(cta.id_banco)}</h3>
              <p className="text-xs text-gray-500 font-mono mb-4">Nº {cta.numero_cuenta}</p>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-gray-400 uppercase font-bold">Saldo Disponible</span>
                  <span className="text-lg font-black text-green-600">
                    Gs. {saldoDisponible.toLocaleString('de-DE')}
                  </span>
                </div>
                
                <div className="flex justify-between items-end pt-2 border-t border-dashed">
                  <span className="text-xs text-gray-400 uppercase font-bold">Saldo Real</span>
                  <span className="text-sm font-bold text-gray-700">
                    Gs. {saldoReal.toLocaleString('de-DE')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de Movimientos de la Cuenta Seleccionada */}
      {cuentaSeleccionada && (
        <div className="bg-white rounded-xl shadow-md border border-orange-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Wallet className="text-erp-orange" size={20} />
            <h3 className="font-bold text-gray-700">Movimientos Recientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-orange-50/50 text-erp-orange uppercase text-[10px] font-black">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Concepto</th>
                  <th className="px-4 py-3 text-right">Ingreso</th>
                  <th className="px-4 py-3 text-right">Egreso</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movimientos
                  .filter(m => m.id_cuenta === cuentaSeleccionada)
                  .sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento))
                  .map((m) => (
                    <tr key={m.id_movimiento} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{m.fecha_movimiento}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{m.concepto}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-bold">
                        {m.monto_ingreso > 0 ? `+${m.monto_ingreso.toLocaleString('de-DE')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-bold">
                        {m.monto_egreso > 0 ? `-${m.monto_egreso.toLocaleString('de-DE')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          m.fecha_confirmacion 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {m.fecha_confirmacion ? 'CONFIRMADO' : 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCuentas;