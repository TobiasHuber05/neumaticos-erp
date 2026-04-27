import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Lock, Unlock, CheckCircle2 } from 'lucide-react';

import { usePeriodosContables } from '../../hooks/usePeriodosContables';

const PeriodosContables = () => {
  const { periodos, loading, crearPeriodo, cerrarPeriodo } = usePeriodosContables();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoPeriodo, setNuevoPeriodo] = useState({
    periodo_anho: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    moneda: 'PYG'
  });

  const handleCrear = async (e) => {
    e.preventDefault();
    const res = await crearPeriodo(nuevoPeriodo);
    if (res.ok) {
      setMostrarForm(false);
      setNuevoPeriodo({
        periodo_anho: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        moneda: 'PYG'
      });
    } else {
      alert(res.error);
    }
  };

  const handleCerrar = async (id) => {
    if (!confirm('¿Está seguro de cerrar este periodo? Esta acción es irreversible.')) return;
    const res = await cerrarPeriodo(id);
    if (!res.ok) alert(res.error);
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const date = new Date(fechaStr);
    return `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCFullYear()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-erp-orange flex items-center gap-2">
          <Calendar /> Gestión de Periodos Contables
        </h2>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-erp-orange text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors"
        >
          <Plus size={18} /> Nuevo Periodo
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 animate-in fade-in zoom-in duration-200">
          <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700">Año del Periodo</label>
              <input
                type="text"
                placeholder="Ej: 2024"
                className="w-full p-2 border rounded-lg"
                value={nuevoPeriodo.periodo_anho}
                onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, periodo_anho: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Descripción</label>
              <input
                type="text"
                placeholder="Ej: Ejercicio Fiscal 2024"
                className="w-full p-2 border rounded-lg"
                value={nuevoPeriodo.descripcion}
                onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, descripcion: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                className="w-full p-2 border rounded-lg"
                value={nuevoPeriodo.fecha_inicio}
                onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, fecha_inicio: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Fecha Fin</label>
              <input
                type="date"
                className="w-full p-2 border rounded-lg"
                value={nuevoPeriodo.fecha_fin}
                onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, fecha_fin: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-erp-orange text-white font-bold rounded-lg hover:bg-orange-600"
              >
                Guardar Periodo
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-orange-100">
        <table className="w-full text-left">
          <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
            <tr>
              <th className="px-6 py-4">Año</th>
              <th className="px-6 py-4">Descripción</th>
              <th className="px-6 py-4">Rango de Fechas</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-50">
            {periodos.map((p) => (
              <tr key={p.id_proc_contable} className="hover:bg-orange-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{p.periodo_anho}</td>
                <td className="px-6 py-4 text-gray-600">{p.descripcion}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {formatFecha(p.fecha_inicio)} - {formatFecha(p.fecha_fin)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    p.estado === 'Abierto' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {p.estado === 'Abierto' ? <Unlock size={14} /> : <Lock size={14} />}
                    {p.estado.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {p.estado === 'Abierto' && (
                    <button
                      onClick={() => handleCerrar(p.id_proc_contable)}
                      className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1 uppercase"
                    >
                      <Lock size={14} /> Cerrar Periodo
                    </button>
                  )}
                  {p.estado === 'Cerrado' && (
                    <span className="text-gray-400 text-xs font-bold flex items-center gap-1 uppercase">
                      <CheckCircle2 size={14} /> Finalizado
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {periodos.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                  No hay periodos contables registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PeriodosContables;
