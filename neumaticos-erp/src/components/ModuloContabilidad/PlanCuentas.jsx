import React, { useState } from 'react';
import { planDeCuentasInicial } from '../../data/erpInitialContabilidad';

const PlanCuentas = () => {
  const [cuentas, setCuentas] = useState(planDeCuentasInicial);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [nuevaCuenta, setNuevaCuenta] = useState({
    codigo: '',
    nombre: '',
    tipo: 'Asentable',
    padreId: '',
    nivel: 1
  });

  const filteredCuentas = cuentas.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.codigo.includes(searchTerm)
  );

  const handleAddCuenta = () => {
    const id = cuentas.length + 1;
    const padre = cuentas.find(c => c.id === Number(nuevaCuenta.padreId));
    const nivel = padre ? padre.nivel + 1 : 1;
    
    setCuentas([...cuentas, { ...nuevaCuenta, id, nivel, padreId: nuevaCuenta.padreId ? Number(nuevaCuenta.padreId) : null }]);
    setShowForm(false);
    setNuevaCuenta({ codigo: '', nombre: '', tipo: 'Asentable', padreId: '', nivel: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Buscar cuenta por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-orange-100 rounded-2xl py-3 px-12 font-medium text-gray-700 focus:border-erp-orange focus:outline-none shadow-sm transition-all"
          />
          <svg className="w-5 h-5 text-erp-orange absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        
        <button 
          onClick={() => setShowForm(true)}
          className="bg-erp-orange hover:bg-orange-600 text-white font-black py-3 px-8 rounded-2xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/>
          </svg>
          AGREGAR CUENTA
        </button>
      </div>

      {/* Plan de Cuentas Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-orange-50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-orange-50/50 border-b border-orange-100">
              <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest">Código</th>
              <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest">Nombre de la Cuenta</th>
              <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest text-center">Tipo</th>
              <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest text-center">Nivel</th>
              <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredCuentas.sort((a, b) => a.codigo.localeCompare(b.codigo)).map((cuenta) => (
              <tr 
                key={cuenta.id} 
                className={`hover:bg-orange-50/30 transition-colors ${cuenta.tipo === 'Totalizadora' ? 'bg-gray-50/30 font-bold' : ''}`}
              >
                <td className="p-4 text-sm font-mono text-gray-500">
                  {cuenta.codigo}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3" style={{ paddingLeft: `${(cuenta.nivel - 1) * 24}px` }}>
                    {cuenta.tipo === 'Totalizadora' ? (
                      <svg className="w-5 h-5 text-erp-yellow" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    )}
                    <span className={cuenta.tipo === 'Totalizadora' ? 'text-gray-900' : 'text-gray-600'}>
                      {cuenta.nombre}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                    cuenta.tipo === 'Totalizadora' 
                    ? 'bg-erp-yellow/20 text-erp-yellow' 
                    : 'bg-blue-100 text-blue-600'
                  }`}>
                    {cuenta.tipo}
                  </span>
                </td>
                <td className="p-4 text-center font-bold text-gray-400 text-xs">
                  {cuenta.nivel}
                </td>
                <td className="p-4 text-right">
                  <button className="text-gray-300 hover:text-erp-orange transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-erp-orange p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-black uppercase tracking-tighter">Nueva Cuenta Contable</h2>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Cuenta Padre</label>
                <select 
                  value={nuevaCuenta.padreId}
                  onChange={(e) => setNuevaCuenta({...nuevaCuenta, padreId: e.target.value})}
                  className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none outline-none transition-all"
                >
                  <option value="">Ninguna (Nivel Raíz)</option>
                  {cuentas.filter(c => c.tipo === 'Totalizadora').map(c => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Código</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 1.1.01.05"
                    value={nuevaCuenta.codigo}
                    onChange={(e) => setNuevaCuenta({...nuevaCuenta, codigo: e.target.value})}
                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Tipo de Cuenta</label>
                  <select 
                    value={nuevaCuenta.tipo}
                    onChange={(e) => setNuevaCuenta({...nuevaCuenta, tipo: e.target.value})}
                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none outline-none transition-all"
                  >
                    <option value="Asentable">Asentable</option>
                    <option value="Totalizadora">Totalizadora</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Nombre de la Cuenta</label>
                <input 
                  type="text" 
                  placeholder="Ej: Banco Nacional Cuenta Corriente"
                  value={nuevaCuenta.nombre}
                  onChange={(e) => setNuevaCuenta({...nuevaCuenta, nombre: e.target.value})}
                  className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none outline-none transition-all"
                />
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleAddCuenta}
                  className="w-full bg-erp-orange hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-95"
                >
                  GUARDAR CUENTA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanCuentas;
