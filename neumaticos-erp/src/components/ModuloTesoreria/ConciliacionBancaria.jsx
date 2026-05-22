import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Search, Save, Info, ArrowLeft, CheckCircle } from 'lucide-react';
import { puedeEditar } from '../../utils/permisos';

const ConciliacionBancaria = ({ movimientos, cuentas, conciliaciones, onCrear, onVincular, onFinalizar, onGetDetalle }) => {
  const [cuentaId, setCuentaId] = useState('');
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [conciliacionActiva, setConciliacionActiva] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [saldoBanco, setSaldoBanco] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Movimientos pendientes para la cuenta seleccionada
  const movimientosDisponibles = useMemo(() => {
    if (!cuentaId) return [];
    return movimientos.filter(m => 
      m.id_cuenta === Number(cuentaId) && !m.fecha_confirmacion
    );
  }, [movimientos, cuentaId]);

  // Cálculos de conciliación
  const totalERP = useMemo(() => {
    return seleccionados.reduce((acc, id) => {
      const m = movimientos.find(mov => mov.id_movimiento === id);
      if (!m) return acc;
      const ingreso = Number(m.monto_ingreso ?? 0);
      const egreso = Number(m.monto_egreso ?? 0);
      return acc + (ingreso - egreso);
    }, 0);
  }, [seleccionados, movimientos]);

  const diferencia = useMemo(() => {
    const sb = Number(saldoBanco || 0);
    return sb - totalERP;
  }, [saldoBanco, totalERP]);

  const handleCrear = async () => {
    if (!cuentaId || !saldoBanco) return;
    const res = await onCrear({
      id_cuenta: cuentaId,
      fecha: new Date().toISOString(),
      descripcion: descripcion || `Conciliación ${new Date().toLocaleDateString()}`,
      saldo_banco: Number(saldoBanco)
    });

    if (res.ok) {
      setConciliacionActiva(res.data);
      setShowModalNueva(false);
    }
  };

  const toggleMovimiento = (id) => {
    setSeleccionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleFinalizar = async () => {
    if (Math.abs(diferencia) > 0.01) {
      alert("No se puede finalizar. La diferencia debe ser cero.");
      return;
    }

    // 1. Vincular los seleccionados
    await onVincular(conciliacionActiva.id_conciliacion, seleccionados);
    
    // 2. Finalizar
    const res = await onFinalizar(conciliacionActiva.id_conciliacion);
    if (res.ok) {
      setConciliacionActiva(null);
      setSeleccionados([]);
      setSaldoBanco('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Conciliación Bancaria</h1>
          <p className="text-gray-500">Asegura que los saldos del ERP coincidan con tu banco</p>
        </div>
        {!conciliacionActiva && puedeEditar('tesoreria') && (
          <button
            onClick={() => setShowModalNueva(true)}
            className="px-6 py-3 bg-erp-orange text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg transition-all"
          >
            Nueva Conciliación
          </button>
        )}
      </div>

      {!conciliacionActiva ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Historial de Conciliaciones */}
          <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-700">Últimas Conciliaciones</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                  <tr>
                    <th className="px-6 py-4 text-left">Fecha</th>
                    <th className="px-6 py-4 text-left">Cuenta / Banco</th>
                    <th className="px-6 py-4 text-right">Saldo Banco</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {conciliaciones.map((c) => (
                    <tr 
                      key={c.id_conciliacion} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={async () => {
                        if (c.estado === 'Pendiente') {
                          // Cargamos el detalle completo antes de activar
                          const detalle = await onGetDetalle(c.id_conciliacion);
                          setCuentaId(c.id_cuenta);
                          setSaldoBanco(c.saldo_banco);
                          setDescripcion(c.descripcion);
                          // Si ya tenía movimientos vinculados, los marcamos
                          if (detalle && detalle.detalle_conciliacion) {
                            setSeleccionados(detalle.detalle_conciliacion.map(d => d.id_movimiento));
                          }
                          setConciliacionActiva(c);
                        }
                      }}
                    >
                      <td className="px-6 py-4 text-sm">{c.fecha}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{c.numero_cuenta}</div>
                        <div className="text-xs text-gray-500">{c.banco}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-700">
                        Gs. {c.saldo_banco.toLocaleString('de-DE')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                            c.estado === 'Cerrada' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {c.estado}
                          </span>
                          {c.estado === 'Pendiente' && (
                            <span className="text-[9px] text-erp-orange font-bold animate-pulse">Click para continuar</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {conciliaciones.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-gray-400 italic">
                        No hay conciliaciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* UI de Conciliación ACTIVA */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border-2 border-erp-orange shadow-sm">
              <label className="block text-[10px] font-black text-gray-400 uppercase">Saldo Extracto Banco</label>
              <div className="text-xl font-black text-gray-800">Gs. {Number(saldoBanco).toLocaleString('de-DE')}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-black text-gray-400 uppercase">Monto Seleccionado (ERP)</label>
              <div className="text-xl font-black text-erp-orange">Gs. {totalERP.toLocaleString('de-DE')}</div>
            </div>
            <div className={`bg-white p-5 rounded-2xl shadow-sm border-2 ${diferencia === 0 ? 'border-green-500 bg-green-50' : 'border-red-100'}`}>
              <label className="block text-[10px] font-black text-gray-400 uppercase">Diferencia</label>
              <div className={`text-xl font-black ${diferencia === 0 ? 'text-green-600' : 'text-red-600'}`}>
                Gs. {diferencia.toLocaleString('de-DE')}
              </div>
            </div>
            <div className="flex items-center justify-center">
              {puedeEditar('tesoreria') && (
                <button
                  onClick={handleFinalizar}
                  disabled={Math.abs(diferencia) > 0.01 || seleccionados.length === 0}
                  className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg hover:bg-green-700 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={22} />
                  Finalizar Conciliación
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button onClick={() => setConciliacionActiva(null)} className="p-1 hover:bg-gray-200 rounded-full">
                  <ArrowLeft size={18} />
                </button>
                <span className="font-bold text-gray-700 uppercase text-xs">Movimientos Pendientes para conciliar</span>
              </div>
              <div className="text-xs font-bold text-erp-orange bg-orange-50 px-3 py-1 rounded-full">
                {seleccionados.length} marcados
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-6 py-4 w-10"></th>
                    <th className="px-6 py-4 text-left">Fecha</th>
                    <th className="px-6 py-4 text-left">Concepto / Instrumento</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movimientosDisponibles.map((m) => {
                    const monto = m.monto_ingreso > 0 ? Number(m.monto_ingreso) : -Number(m.monto_egreso);
                    const color = monto > 0 ? 'text-green-600' : 'text-red-600';
                    const isSelected = seleccionados.includes(m.id_movimiento);
                    
                    return (
                      <tr 
                        key={m.id_movimiento} 
                        onClick={() => toggleMovimiento(m.id_movimiento)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${isSelected ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 bg-white'}`}>
                            {isSelected && <CheckCircle size={14} />}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-600">{m.fecha_movimiento}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{m.concepto}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{m.tipo_deposito}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-black">
                          <span className={color}>Gs. {monto.toLocaleString('de-DE')}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Conciliación */}
      {showModalNueva && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-erp-orange p-6 text-white text-center">
              <Info className="mx-auto mb-2 opacity-50" size={32} />
              <h2 className="text-xl font-bold">Iniciar Conciliación</h2>
              <p className="text-orange-100 text-xs">Configura los datos del extracto bancario</p>
            </div>
            
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cuenta Bancaria</label>
                <select 
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                  className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-erp-orange outline-none"
                >
                  <option value="">Seleccionar cuenta...</option>
                  {cuentas.map(c => (
                    <option key={c.id_cuenta} value={c.id_cuenta}>
                      {c.numero_cuenta} - {c.banco?.nombre || 'Banco'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Saldo según Banco (Extracto)</label>
                <input 
                  type="number"
                  placeholder="0"
                  value={saldoBanco}
                  onChange={(e) => setSaldoBanco(e.target.value)}
                  className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-erp-orange outline-none font-black text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción / Periodo</label>
                <input 
                  type="text"
                  placeholder="Ej: Abril 2026"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-erp-orange outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowModalNueva(false)}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCrear}
                  className="flex-1 py-3 bg-erp-orange text-white font-bold rounded-xl hover:bg-orange-600 shadow-md transition-all"
                >
                  Empezar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConciliacionBancaria;