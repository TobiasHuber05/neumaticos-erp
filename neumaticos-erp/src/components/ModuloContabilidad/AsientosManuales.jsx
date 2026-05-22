import React, { useState, useMemo, useEffect } from 'react';
import { usePlanCuentas } from '../../hooks/usePlanCuentas';
import { useAsientosContables } from '../../hooks/useAsientosContables';
import { Eye } from 'lucide-react';
import { puedeEditar } from '../../utils/permisos';

const AsientosManuales = () => {
  const { periodos, periodoActivo, setPeriodoActivo, cuentas } = usePlanCuentas();
  const { asientos, loading, crearAsiento, getDetalleOrigen } = useAsientosContables(periodoActivo);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  const [detalleOrigen, setDetalleOrigen] = useState(null);

  useEffect(() => {
    if (asientoSeleccionado && asientoSeleccionado.tabla_origen !== 'asiento_manual') {
      getDetalleOrigen(asientoSeleccionado.id_asiento).then(data => {
        setDetalleOrigen(data.items);
      });
    } else {
      setDetalleOrigen(null);
    }
  }, [asientoSeleccionado]);

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
    cuentas.filter(c => c.asentable === true),
    [cuentas]);

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
  const isBalanced = Math.abs(totalDebe - totalHaber) < 0.01 && totalDebe > 0;

  const handleGuardar = async () => {
    if (!isBalanced) {
      setErrorMsg('El asiento no está balanceado (Debe != Haber)');
      return;
    }

    if (!nuevoAsiento.descripcion) {
      setErrorMsg('La descripción es obligatoria');
      return;
    }

    const payload = {
      fecha: nuevoAsiento.fecha,
      descripcion: nuevoAsiento.descripcion,
      id_proc_contable: periodoActivo,
      detalles: nuevoAsiento.lineas.map(l => ({
        id_cuenta: l.cuentaId,
        monto: Number(l.debe) > 0 ? Number(l.debe) : Number(l.haber),
        debe_haber: Number(l.debe) > 0 // true = debe, false = haber
      }))
    };

    const res = await crearAsiento(payload);
    if (res.ok) {
      setShowForm(false);
      setNuevoAsiento({
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        lineas: [
          { id: Date.now(), cuentaId: '', glosa: '', debe: 0, haber: 0 },
          { id: Date.now() + 1, cuentaId: '', glosa: '', debe: 0, haber: 0 },
        ]
      });
      setErrorMsg(null);
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con Periodo y Nuevo Asiento */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 bg-white border border-orange-100 rounded-2xl px-4 py-3 shadow-sm w-fit">
          <span className="text-xs font-black text-erp-orange uppercase">Periodo:</span>
          <select
            value={periodoActivo || ''}
            onChange={(e) => setPeriodoActivo(e.target.value ? Number(e.target.value) : null)}
            className="text-sm font-bold text-gray-700 focus:outline-none bg-transparent"
          >
            <option value="">Todos los Periodos</option>
            {periodos.map(p => (
              <option key={p.id} value={p.id}>{p.periodo} — {p.estado}</option>
            ))}
          </select>
        </div>

        {puedeEditar('contabilidad') && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-erp-orange hover:bg-orange-600 text-white font-black py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            NUEVO ASIENTO MANUAL
          </button>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="flex gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-erp-orange w-48">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Asientos</p>
          <p className="text-2xl font-black text-gray-700">{asientos.length}</p>
        </div>
      </div>

      {/* Lista de Asientos */}
      <div className="bg-white rounded-3xl shadow-xl border border-orange-50 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-400 font-bold animate-pulse">Cargando asientos...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-orange-50/50 border-b border-orange-100">
              <tr>
                <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest">N° Asiento</th>
                <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest">Fecha</th>
                <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest">Descripción</th>
                <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest text-right">Debe</th>
                <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest text-right">Haber</th>
                <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest text-center">Estado</th>
                <th className="p-5 text-[10px] font-black text-erp-orange uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {asientos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-400 italic">No hay asientos registrados en este periodo</td>
                </tr>
              ) : (
                asientos.map((asiento) => (
                  <tr key={asiento.id_asiento} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-5 font-bold text-gray-700">#{asiento.numero_asiento}</td>
                    <td className="p-5 text-gray-500 text-sm">{new Date(asiento.fecha).toLocaleDateString()}</td>
                    <td className="p-5 text-gray-700 font-medium">
                      {asiento.descripcion}
                      <div className="text-[10px] text-gray-400 mt-1">
                        {asiento.asiento_detalle?.length || 0} movimientos
                      </div>
                    </td>
                    <td className="p-5 text-right font-black text-gray-800">{Number(asiento.total_debe).toLocaleString()}</td>
                    <td className="p-5 text-right font-black text-gray-800">{Number(asiento.total_haber).toLocaleString()}</td>
                    <td className="p-5 text-center">
                      <span className="px-3 py-1 rounded-full bg-orange-100 text-erp-orange text-[10px] font-black uppercase">
                        {asiento.estado}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => setAsientoSeleccionado(asiento)}
                        className="text-gray-400 hover:text-erp-orange transition-colors"
                        title="Ver detalle"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-erp-orange p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-black uppercase tracking-tighter">Crear Nuevo Asiento Manual</h2>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errorMsg}
                </div>
              )}

              {/* Cabecera del Asiento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Fecha Contable</label>
                  <input
                    type="date"
                    value={nuevoAsiento.fecha}
                    onChange={(e) => setNuevoAsiento({ ...nuevoAsiento, fecha: e.target.value })}
                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-erp-orange uppercase mb-1">Descripción / Concepto General</label>
                  <input
                    type="text"
                    placeholder="Ej: Ajuste por diferencia de cambio..."
                    value={nuevoAsiento.descripcion}
                    onChange={(e) => setNuevoAsiento({ ...nuevoAsiento, descripcion: e.target.value })}
                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-3 font-bold text-gray-700 focus:border-erp-orange focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Tabla de Líneas */}
              <div className="border-2 border-orange-50 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-orange-50 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-[9px] font-black text-erp-orange uppercase w-1/3 text-left">Cuenta Contable</th>
                      <th className="p-3 text-[9px] font-black text-erp-orange uppercase text-left">Glosa Detalle</th>
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
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold focus:ring-2 ring-erp-orange outline-none"
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
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none"
                            placeholder="Glosa opcional..."
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={linea.debe}
                            onChange={(e) => handleLineChange(linea.id, 'debe', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-right font-black outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={linea.haber}
                            onChange={(e) => handleLineChange(linea.id, 'haber', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-right font-black outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <button onClick={() => handleRemoveLine(linea.id)} className="text-red-400 hover:text-red-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
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
                    <p className={`text-xl font-black ${Math.abs(totalDebe - totalHaber) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      {(totalDebe - totalHaber).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {!isBalanced && (
                    <span className="text-[10px] font-black text-red-500 uppercase animate-pulse flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {totalDebe === 0 ? 'Debe haber montos' : 'El asiento no está cuadrado'}
                    </span>
                  )}
                  <button
                    onClick={handleGuardar}
                    disabled={!isBalanced}
                    className={`font-black py-4 px-10 rounded-2xl shadow-xl transition-all ${isBalanced
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

      {/* Modal de Detalle de Asiento */}
      {asientoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-800 p-6 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Detalle de Asiento #{asientoSeleccionado.numero_asiento}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(asientoSeleccionado.fecha).toLocaleDateString()} — {asientoSeleccionado.descripcion}</p>
              </div>
              <button onClick={() => setAsientoSeleccionado(null)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Detalle de Productos (Si existe) */}
              {detalleOrigen && detalleOrigen.length > 0 && (
                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-erp-orange uppercase tracking-wider mb-4">Productos vinculados a la operación</h3>
                  <div className="overflow-hidden border border-orange-100 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-orange-100/50 text-orange-800 font-bold uppercase text-[9px]">
                        <tr>
                          <th className="p-3">Producto</th>
                          <th className="p-3 text-center">Cantidad</th>
                          <th className="p-3 text-right">Precio Unit.</th>
                          <th className="p-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-100">
                        {detalleOrigen.map((item, idx) => (
                          <tr key={idx} className="text-gray-700">
                            <td className="p-3 font-medium">{item.producto}</td>
                            <td className="p-3 text-center font-bold">{item.cantidad}</td>
                            <td className="p-3 text-right">{Number(item.precio_unitario).toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">{Number(item.subtotal || (item.cantidad * item.precio_unitario)).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 font-bold text-gray-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Cuenta</th>
                      <th className="p-4">Glosa / Detalle</th>
                      <th className="p-4 text-right">Debe</th>
                      <th className="p-4 text-right">Haber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {asientoSeleccionado.asiento_detalle?.map((det) => (
                      <tr key={det.id_asiento_detalle} className="hover:bg-gray-50/50">
                        <td className="p-4">
                          <span className="font-bold text-erp-orange">{det.plan_cuentas?.cuenta_contable}</span>
                          <span className="ml-2 text-gray-700">{det.plan_cuentas?.nombre}</span>
                        </td>
                        <td className="p-4 text-gray-500">{det.glosa || '—'}</td>
                        <td className="p-4 text-right font-bold">
                          {det.debe_haber ? Number(det.monto).toLocaleString() : ''}
                        </td>
                        <td className="p-4 text-right font-bold">
                          {!det.debe_haber ? Number(det.monto).toLocaleString() : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/50 font-black">
                    <tr>
                      <td colSpan="2" className="p-4 text-right uppercase text-[10px] text-gray-400">Totales</td>
                      <td className="p-4 text-right text-lg">{Number(asientoSeleccionado.total_debe).toLocaleString()}</td>
                      <td className="p-4 text-right text-lg">{Number(asientoSeleccionado.total_haber).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex justify-end">
              <button
                onClick={() => setAsientoSeleccionado(null)}
                className="bg-gray-800 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsientosManuales;
