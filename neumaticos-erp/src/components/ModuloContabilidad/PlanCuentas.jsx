import React, { useState } from 'react';
import { usePlanCuentas } from '../../hooks/usePlanCuentas';

const PlanCuentas = () => {
  const {
    cuentas,
    periodos,
    periodoActivo,
    setPeriodoActivo,
    loading,
    crearCuenta,
    eliminarCuenta,
  } = usePlanCuentas();

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [nuevaCuenta, setNuevaCuenta] = useState({
    cuenta_contable: '',
    nombre: '',
    asentable: true,
    cuenta_padre: '',
    tipo_cuenta: '',
    nivel: 1,
  });

  const filteredCuentas = cuentas.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.codigo ?? '').includes(searchTerm)
  );

  const handleAddCuenta = async () => {
    if (!nuevaCuenta.cuenta_contable || !nuevaCuenta.nombre) {
      setErrorMsg('Código y nombre son requeridos');
      return;
    }

    // Buscamos cualquier ID disponible si el activo falla (usamos String para evitar NaN)
    let idParaGuardar = periodoActivo ? String(periodoActivo) : null;
    
    if ((!idParaGuardar || idParaGuardar === 'NaN') && periodos.length > 0) {
      idParaGuardar = String(periodos[0].id);
    }

    if (!idParaGuardar || idParaGuardar === 'NaN') {
      setErrorMsg(`Error Crítico: ID no válido (${idParaGuardar}). Por favor recarga.`);
      return;
    }

    // Calcular nivel según cuenta padre
    const padre = cuentas.find((c) => c.id === Number(nuevaCuenta.cuenta_padre));
    const nivel = padre ? padre.nivel + 1 : 1;

    const res = await crearCuenta({
      cuenta_contable: nuevaCuenta.cuenta_contable,
      nombre: nuevaCuenta.nombre,
      asentable: nuevaCuenta.asentable,
      cuenta_padre: nuevaCuenta.cuenta_padre ? Number(nuevaCuenta.cuenta_padre) : null,
      tipo_cuenta: nuevaCuenta.tipo_cuenta || null,
      nivel,
      id_proc_contable: idParaGuardar,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setShowForm(false);
    setErrorMsg(null);
    setNuevaCuenta({ cuenta_contable: '', nombre: '', asentable: true, cuenta_padre: '', tipo_cuenta: '', nivel: 1 });
  };

  const handleEliminar = async (id) => {
    const res = await eliminarCuenta(id);
    if (!res.ok) setErrorMsg(res.error);
  };

  return (
    <div className="space-y-6">
      {/* Selector de periodo */}
      {periodos.length > 0 && (
        <div className="flex items-center gap-3 bg-white border border-orange-100 rounded-2xl px-4 py-3 shadow-sm w-fit">
          <span className="text-xs font-black text-erp-orange uppercase">Periodo:</span>
          <select
            value={periodoActivo ? String(periodoActivo) : ''}
            onChange={(e) => setPeriodoActivo(e.target.value || null)}
            className="text-sm font-bold text-gray-700 focus:outline-none bg-transparent"
          >
            <option value="">Todos</option>
            {periodos.map((p) => (
              <option key={`periodo-${p.id}`} value={String(p.id)}>
                {p.periodo || '2026'} — {p.estado}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg flex justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-xs underline">Cerrar</button>
        </div>
      )}

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-erp-orange hover:bg-orange-600 text-white font-black py-3 px-8 rounded-2xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
          AGREGAR CUENTA
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl shadow-xl border border-orange-50 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Cargando plan de cuentas...</p>
        ) : (
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
              {filteredCuentas.map((cuenta) => (
                <tr
                  key={cuenta.id || cuenta.id_cuenta || cuenta.codigo}
                  className={`hover:bg-orange-50/30 transition-colors ${!cuenta.asentable ? 'bg-gray-50/30 font-bold' : ''}`}
                >
                  <td className="p-4 text-sm font-mono text-gray-500">{cuenta.codigo}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3" style={{ paddingLeft: `${(cuenta.nivel - 1) * 24}px` }}>
                      {!cuenta.asentable ? (
                        <svg className="w-5 h-5 text-erp-yellow" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <span className={!cuenta.asentable ? 'text-gray-900' : 'text-gray-600'}>
                        {cuenta.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${!cuenta.asentable
                        ? 'bg-erp-yellow/20 text-erp-yellow'
                        : 'bg-blue-100 text-blue-600'
                      }`}>
                      {cuenta.asentable ? 'Asentable' : 'Totalizadora'}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-gray-400 text-xs">{cuenta.nivel}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleEliminar(cuenta.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                      title="Eliminar cuenta"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCuentas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400">
                    No hay cuentas en el plan contable.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-erp-orange p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-black uppercase tracking-tighter">Nueva Cuenta Contable</h2>
              <button onClick={() => { setShowForm(false); setErrorMsg(null); }} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-5">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{errorMsg}</div>
              )}

              <div>
                <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Cuenta Padre</label>
                <select
                  value={nuevaCuenta.cuenta_padre}
                  onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, cuenta_padre: e.target.value })}
                  className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none"
                >
                  <option value="">Ninguna (Nivel Raíz)</option>
                  {cuentas.filter((c) => !c.asentable).map((c) => (
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
                    value={nuevaCuenta.cuenta_contable}
                    onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, cuenta_contable: e.target.value })}
                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Tipo de Cuenta</label>
                  <select
                    value={nuevaCuenta.asentable ? 'asentable' : 'totalizadora'}
                    onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, asentable: e.target.value === 'asentable' })}
                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none"
                  >
                    <option value="asentable">Asentable</option>
                    <option value="totalizadora">Totalizadora</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Nombre de la Cuenta</label>
                <input
                  type="text"
                  placeholder="Ej: Banco Nacional Cuenta Corriente"
                  value={nuevaCuenta.nombre}
                  onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, nombre: e.target.value })}
                  className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleAddCuenta}
                  className="w-full bg-erp-orange hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all"
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