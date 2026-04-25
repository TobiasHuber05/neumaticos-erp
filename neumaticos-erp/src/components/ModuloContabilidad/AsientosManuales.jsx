import React, { useState, useMemo } from 'react';
import { asientosContablesIniciales, planDeCuentasInicial } from '../../data/erpInitialContabilidad';

const AsientosManuales = () => {
  const [asientos, setAsientos] = useState(asientosContablesIniciales);
  const [showForm, setShowForm] = useState(false);
  
  // Estado para el nuevo asiento
  const [nuevoAsiento, setNuevoAsiento] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    lineas: [
      { id: Date.now(), cuentaId: '', glosa: '', debe: 0, haber: 0 },
      { id: Date.now() + 1, cuentaId: '', glosa: '', debe: 0, haber: 0 },
    ]
  });

  const cuentasAsentables = useMemo(() => 
    planDeCuentasInicial.filter(c => c.tipo === 'Asentable'), 
  []);

  const handleAddLine = () => {
    setNuevoAsiento({
      ...nuevoAsiento,
      lineas: [...nuevoAsiento.lineas, { id: Date.now(), cuentaId: '', glosa: '', debe: 0, haber: 0 }]
    });
  };

  const handleRemoveLine = (id) => {
    setNuevoAsiento({
      ...nuevoAsiento,
      lineas: nuevoAsiento.lineas.filter(l => l.id !== id)
    });
  };

  const handleLineChange = (id, field, value) => {
    const updatedLineas = nuevoAsiento.lineas.map(l => {
      if (l.id === id) {
        return { ...l, [field]: value };
      }
      return l;
    });
    setNuevoAsiento({ ...nuevoAsiento, lineas: updatedLineas });
  };

  const totalDebe = nuevoAsiento.lineas.reduce((sum, l) => sum + Number(l.debe || 0), 0);
  const totalHaber = nuevoAsiento.lineas.reduce((sum, l) => sum + Number(l.haber || 0), 0);
  const isBalanced = totalDebe === totalHaber && totalDebe > 0;

  const handleGuardar = () => {
    if (!isBalanced) {
      alert('El asiento no está balanceado (Debe != Haber)');
      return;
    }
    const asientoFinal = {
      ...nuevoAsiento,
      id: asientos.length + 1,
      numero: `AS-2026-00${asientos.length + 1}`,
      estado: 'Asentado',
      totalDebe,
      totalHaber
    };
    setAsientos([asientoFinal, ...asientos]);
    setShowForm(false);
    setNuevoAsiento({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      lineas: [
        { id: Date.now(), cuentaId: '', glosa: '', debe: 0, haber: 0 },
        { id: Date.now() + 1, cuentaId: '', glosa: '', debe: 0, haber: 0 },
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas rápidas */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-erp-orange">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Asientos</p>
            <p className="text-2xl font-black text-gray-700">{asientos.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-green-500">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Balanceados</p>
            <p className="text-2xl font-black text-green-600">{asientos.filter(a => a.totalDebe === a.totalHaber).length}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-erp-orange hover:bg-orange-600 text-white font-black py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
          NUEVO ASIENTO MANUAL
        </button>
      </div>

      {/* Lista de Asientos */}
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-orange-50 border-b border-orange-100">
            <tr>
              <th className="p-4 text-[10px] font-black text-erp-orange uppercase">Número</th>
              <th className="p-4 text-[10px] font-black text-erp-orange uppercase">Fecha</th>
              <th className="p-4 text-[10px] font-black text-erp-orange uppercase">Descripción</th>
              <th className="p-4 text-[10px] font-black text-erp-orange uppercase text-right">Debe</th>
              <th className="p-4 text-[10px] font-black text-erp-orange uppercase text-right">Haber</th>
              <th className="p-4 text-[10px] font-black text-erp-orange uppercase text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {asientos.map((asiento) => (
              <tr key={asiento.id} className="hover:bg-orange-50/30 transition-colors">
                <td className="p-4 font-bold text-gray-700">{asiento.numero}</td>
                <td className="p-4 text-gray-500 text-sm">{asiento.fecha}</td>
                <td className="p-4 text-gray-700 font-medium">{asiento.descripcion}</td>
                <td className="p-4 text-right font-bold text-gray-800">{asiento.totalDebe.toLocaleString()}</td>
                <td className="p-4 text-right font-bold text-gray-800">{asiento.totalHaber.toLocaleString()}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    asiento.estado === 'Asentado' ? 'bg-green-100 text-green-700' : 'bg-erp-yellow/20 text-erp-yellow'
                  }`}>
                    {asiento.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-erp-orange p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-black uppercase tracking-tighter">Crear Nuevo Asiento Manual</h2>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Cabecera del Asiento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Fecha Contable</label>
                  <input 
                    type="date" 
                    value={nuevoAsiento.fecha}
                    onChange={(e) => setNuevoAsiento({...nuevoAsiento, fecha: e.target.value})}
                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Descripción / Concepto General</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Ajuste por diferencia de cambio..."
                    value={nuevoAsiento.descripcion}
                    onChange={(e) => setNuevoAsiento({...nuevoAsiento, descripcion: e.target.value})}
                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Tabla de Líneas */}
              <div className="border-2 border-orange-50 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="p-3 text-[9px] font-black text-erp-orange uppercase w-1/3">Cuenta Contable</th>
                      <th className="p-3 text-[9px] font-black text-erp-orange uppercase">Glosa Detalle</th>
                      <th className="p-3 text-[9px] font-black text-erp-orange uppercase w-32 text-right">Debe</th>
                      <th className="p-3 text-[9px] font-black text-erp-orange uppercase w-32 text-right">Haber</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {nuevoAsiento.lineas.map((linea) => (
                      <tr key={linea.id}>
                        <td className="p-2">
                          <select 
                            value={linea.cuentaId}
                            onChange={(e) => handleLineChange(linea.id, 'cuentaId', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 ring-erp-orange outline-none"
                          >
                            <option value="">Seleccionar cuenta...</option>
                            {cuentasAsentables.map(c => (
                              <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={linea.glosa}
                            onChange={(e) => handleLineChange(linea.id, 'glosa', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none"
                            placeholder="Glosa opcional..."
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={linea.debe}
                            onChange={(e) => handleLineChange(linea.id, 'debe', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-right font-bold outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={linea.haber}
                            onChange={(e) => handleLineChange(linea.id, 'haber', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-right font-bold outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <button onClick={() => handleRemoveLine(linea.id)} className="text-red-400 hover:text-red-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button 
                onClick={handleAddLine}
                className="flex items-center gap-2 text-erp-orange font-black text-[10px] uppercase hover:bg-orange-50 px-4 py-2 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                Agregar Línea
              </button>

              {/* Totales y Validación */}
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                <div className="flex gap-8">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Total Debe</p>
                    <p className="text-xl font-black text-gray-700">{totalDebe.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Total Haber</p>
                    <p className="text-xl font-black text-gray-700">{totalHaber.toLocaleString()}</p>
                  </div>
                  <div className="text-right border-l border-orange-200 pl-8">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Diferencia</p>
                    <p className={`text-xl font-black ${totalDebe - totalHaber === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(totalDebe - totalHaber).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {!isBalanced && (
                    <span className="text-[10px] font-black text-red-500 uppercase animate-pulse flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      El asiento debe estar balanceado
                    </span>
                  )}
                  <button 
                    onClick={handleGuardar}
                    disabled={!isBalanced}
                    className={`font-black py-4 px-10 rounded-2xl shadow-xl transition-all ${
                      isBalanced 
                      ? 'bg-erp-orange hover:bg-orange-600 text-white transform hover:scale-105 active:scale-95' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    GUARDAR ASIENTO
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsientosManuales;
