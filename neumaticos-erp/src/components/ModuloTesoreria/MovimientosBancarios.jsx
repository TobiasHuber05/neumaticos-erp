import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, X, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle2 } from 'lucide-react';
import MovimientoManualForm from '../Forms/MovimientoManualForm';
import { useModuloTesoreria } from '../../hooks/useModuloTesoreria';
import { debeConfirmarInmediatamente } from '../../utils/tesoreriasLogis';

const MovimientosBancarios = () => {
  const { movimientos, cuentas, bancos, registrarMovimiento } = useModuloTesoreria();
  const [search, setSearch] = useState('');
  const [filterCuenta, setFilterCuenta] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showForm, setShowForm] = useState(false);

  const filteredMovs = useMemo(() => {
    return movimientos.filter((m) => {
      const matchSearch = search === '' || 
        m.concepto.toLowerCase().includes(search.toLowerCase()) ||
        m.fecha_movimiento.includes(search);
      const matchCuenta = filterCuenta === '' || m.id_cuenta == filterCuenta;
      const matchTipo = filterTipo === 'todos' || 
        (filterTipo === 'ingreso' && m.monto_ingreso > 0) ||
        (filterTipo === 'egreso' && m.monto_egreso > 0);
      const matchEstado = filterEstado === 'todos' || 
        (filterEstado === 'pendiente' && !m.fecha_confirmacion) ||
        (filterEstado === 'confirmado' && m.fecha_confirmacion);
      return matchSearch && matchCuenta && matchTipo && matchEstado;
    }).sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento));
  }, [movimientos, search, filterCuenta, filterTipo, filterEstado]);

  const nombreCuenta = (id) => {
    const cuenta = cuentas.find(c => c.id_cuenta === id);
    return cuenta ? cuenta.numero_cuenta : 'N/A';
  };

  const nombreBanco = (id) => {
    const cuenta = cuentas.find(c => c.id_cuenta === id);
    if (!cuenta) return 'N/A';
    const banco = bancos.find(b => b.id_banco === cuenta.id_banco);
    return banco ? banco.nombre : 'N/A';
  };

  const handleGuardarMov = (movimiento) => {
    registrarMovimiento(movimiento);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Movimientos Bancarios</h1>
          <p className="text-gray-500">Gestiona todos los ingresos y egresos de tus cuentas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-erp-orange text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg transition-all"
        >
          <Plus size={20} />
          Nuevo Movimiento
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent"
                placeholder="Concepto o fecha..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cuenta</label>
            <select
              value={filterCuenta}
              onChange={(e) => setFilterCuenta(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange"
            >
              <option value="">Todas las cuentas</option>
              {cuentas.map((c) => (
                <option key={c.id_cuenta} value={c.id_cuenta}>
                  {c.numero_cuenta}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange"
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="font-bold text-erp-orange text-sm uppercase">
              {filteredMovs.length} movimientos encontrados
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                <th className="px-6 py-4 text-left">Fecha</th>
                <th className="px-6 py-4 text-left">Cuenta / Banco</th>
                <th className="px-6 py-4 text-left">Concepto</th>
                <th className="px-8 py-4 text-right">Monto</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMovs.map((m) => {
                const monto = m.monto_ingreso > 0 ? `+Gs. ${m.monto_ingreso.toLocaleString('de-DE')}` : `-Gs. ${m.monto_egreso.toLocaleString('de-DE')}`;
                const color = m.monto_ingreso > 0 ? 'text-green-600' : 'text-red-600';
                const icon = m.fecha_confirmacion ? <CheckCircle2 size={16} className="text-green-500" /> : <Clock size={16} className="text-amber-500" />;
                const estado = m.fecha_confirmacion ? 'Confirmado' : 'Pendiente';
                return (
                  <tr key={m.id_movimiento} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm">{m.fecha_movimiento}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-mono text-sm">{nombreCuenta(m.id_cuenta)}</div>
                        <div className="text-xs text-gray-500">{nombreBanco(m.id_cuenta)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{m.concepto}</td>
                    <td className="px-8 py-4 text-right">
                      <span className={`font-black text-lg ${color}`}>{monto}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                        m.fecha_confirmacion 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {icon}
                        {estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredMovs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowUpCircle size={48} className="text-gray-300" />
                      <p className="text-lg font-medium">No hay movimientos que coincidan con los filtros</p>
                      <p className="text-sm">Ajusta los filtros o crea el primer movimiento</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Movement Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <MovimientoManualForm
              cuentas={cuentas}
              onCancelar={() => setShowForm(false)}
              onGuardar={handleGuardarMov}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MovimientosBancarios;
