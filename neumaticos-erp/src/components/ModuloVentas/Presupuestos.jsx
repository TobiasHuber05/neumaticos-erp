import { useState } from 'react';
import { FileText, Plus, Eye, CalendarX, Clock, User } from 'lucide-react';
import PresupuestoForm from '../Forms/PresupuestoForm';
import FacturaVentaForm from '../Forms/FacturaVentaForm';
import * as ventasLogic from '../../utils/ventasLogic.js';

/**
 * Lista presupuestos: vigentes/expirados, +new, →factura.
 * Props: ventas (hook), clientes, inventario, setInventario
 */
const Presupuestos = ({ ventas, clientes, inventario, setInventario, servicios = [] }) => {
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [editandoPresupuesto, setEditandoPresupuesto] = useState(null);

  const vigentes = ventas.presupuestos?.filter(p => ventasLogic.isBudgetVigente(p)) || [];
  const expirados = ventas.presupuestos?.filter(p => !ventasLogic.isBudgetVigente(p)) || [];

  const handleGuardarPresupuesto = async (lineas, clientId, total) => {
  try {
    await ventas.actions.solicitarPresupuesto(clientId, lineas);
    setMostrarNuevo(false);
  } catch (err) {
    alert(err.message);
  }
};

  const handleFacturaClick = (presupuesto) => {
    if (ventasLogic.isBudgetVigente(presupuesto)) {
      setEditandoPresupuesto(presupuesto);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-orange-100">
        <div className="flex items-center gap-3">
          <FileText className="text-erp-orange w-8 h-8" />
          <div>
            <h2 className="text-2xl font-black text-gray-800">Presupuestos</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center gap-1 font-bold">
                <Clock className="w-4 h-4" />
                Vigentes: {vigentes.length}
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <CalendarX className="w-4 h-4" />
                Expirados: {expirados.length}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setMostrarNuevo(true)}
          className="flex items-center gap-2 bg-erp-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md whitespace-nowrap"
        >
          <Plus size={20} />
          Nuevo Presupuesto
        </button>
      </div>

      {/* Form nuevo */}
      {mostrarNuevo && (
        <PresupuestoForm
          clientes={clientes}
          inventario={inventario}
          servicios={servicios}
          onCancelar={() => setMostrarNuevo(false)}
          onGuardar={handleGuardarPresupuesto}
        />
      )}

      {/* Form factura */}
      {editandoPresupuesto && (
        <FacturaVentaForm
          presupuesto={editandoPresupuesto}
          clientes={clientes}
          inventario={inventario}
          setInventario={setInventario}
          ventas={ventas}
          onCancelar={() => setEditandoPresupuesto(null)}
        />
      )}

      {/* Tabla vigentes */}
      {vigentes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-orange-500/5 border-b border-orange-100 px-6 py-4">
            <h3 className="font-bold text-lg text-orange-800 flex items-center gap-2">
              Vigentes (usar en 10 días)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 text-sm uppercase tracking-wide">Nro.</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 text-sm uppercase tracking-wide">Cliente</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700 text-sm uppercase tracking-wide">Líneas</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-700 text-sm uppercase tracking-wide">Total</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700 text-sm uppercase tracking-wide">Expira</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vigentes.map((p) => {
                  const cliente = clientes.find(c => c.id === p.clientId);
                  return (
                    <tr key={p.id} className="hover:bg-orange-50/50 cursor-pointer transition-colors" onClick={() => handleFacturaClick(p)}>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-erp-orange">{p.numero}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="font-bold">{cliente?.nombre} {cliente?.apellido}</span>
                        </div>
                        <span className="text-xs text-gray-500">{cliente?.documento}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{p.lineas.length}</td>
                      <td className="px-6 py-4 text-right font-black text-lg text-gray-900">
                        Gs. {p.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          new Date(p.fechaExpiracion) - new Date() < 2*24*60*60*1000 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {new Date(p.fechaExpiracion).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Eye className="text-erp-orange w-5 h-5 mx-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla expirados */}
      {expirados.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-red-500/5 border-b border-red-100 px-6 py-4">
            <h3 className="font-bold text-lg text-red-800">Expirados (no facturar)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 text-sm uppercase tracking-wide">Nro.</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 text-sm uppercase tracking-wide">Cliente</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700 text-sm uppercase tracking-wide">Total</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700 text-sm uppercase tracking-wide">Expiró</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expirados.map((p) => {
                  const cliente = clientes.find(c => c.id === p.clientId);
                  return (
                    <tr key={p.id} className="opacity-75">
                      <td className="px-6 py-4 font-mono font-bold text-sm text-gray-500">{p.numero}</td>
                      <td className="px-6 py-4">
                        <div>{cliente?.nombre} {cliente?.apellido}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-black">Gs. {p.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center text-sm text-red-600">{p.fechaExpiracion}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ventas.presupuestos?.length === 0 && (
        <div className="text-center py-24 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <FileText className="mx-auto w-20 h-20 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-500 mb-2">No hay presupuestos</h3>
          <p className="text-gray-400 mb-6">Cree el primero haciendo clic en "Nuevo Presupuesto"</p>
        </div>
      )}
    </div>
  );
};

export default Presupuestos;

