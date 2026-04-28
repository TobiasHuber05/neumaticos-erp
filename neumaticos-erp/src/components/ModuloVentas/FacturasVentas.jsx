import { useState } from 'react';
import { ShoppingBag, Clock, CheckCircle, RotateCcw, User, Package, Plus, Search, FileText, X } from 'lucide-react';
import NotaCreditoVentaForm from '../Forms/NotaCreditoVentaForm';
import FacturaVentaForm from '../Forms/FacturaVentaForm';
import * as ventasLogic from '../../utils/ventasLogic.js';

/**
 * Lista facturas ventas, NC si <48h.
 * Props: ventas, clientes, inventario, setInventario
 */
const FacturasVentas = ({ ventas, clientes, inventario, setInventario }) => {
  const [devolviendoFactura, setDevolviendoFactura] = useState(null);
  const [mostrandoSelector, setMostrandoSelector] = useState(false);
  const [clienteSelId, setClienteSelId] = useState('');
  const [presupuestoSel, setPresupuestoSel] = useState(null);

  const facturasPendientes = ventas.facturasVentas?.filter(f => ['Emitida', 'Con NC'].includes(f.estado)) || [];
  const facturasCobradas = ventas.facturasVentas?.filter(f => f.estado === 'Cobrado') || [];

  const handleDevolver = (factura) => {
    if (ventasLogic.validarDevolucion(factura)) {
      setDevolviendoFactura(factura);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-orange-100 mb-8">
        <div className="flex items-center gap-3">
          <ShoppingBag className="text-erp-orange w-8 h-8" />
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Facturas de Venta</h2>
        </div>
        <button
          onClick={() => setMostrandoSelector(true)}
          className="flex items-center gap-2 bg-erp-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md"
        >
          <Plus size={20} />
          Nueva Factura
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-erp-orange text-center">
          <ShoppingBag className="mx-auto w-12 h-12 text-erp-orange mb-4" />
          <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wide mb-2">Facturas pendientes</h3>
          <p className="text-3xl font-black text-erp-orange">{facturasPendientes.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-green-500 text-center">
          <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
          <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wide mb-2">Cobradas</h3>
          <p className="text-3xl font-black text-green-500">{facturasCobradas.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-yellow-500 text-center">
          <RotateCcw className="mx-auto w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wide mb-2">Con NC parcial</h3>
          <p className="text-3xl font-black text-yellow-500">{(ventas.facturasVentas || []).filter(f => f.estado === 'Con NC').length}</p>
        </div>
      </div>

      {/* Selector de Cliente y Presupuesto */}
      {mostrandoSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl border border-orange-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <FileText className="text-erp-orange" />
                Generar Factura desde Presupuesto
              </h3>
              <button onClick={() => { setMostrandoSelector(false); setClienteSelId(''); setPresupuestoSel(null); }} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">1. Seleccionar Cliente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={clienteSelId}
                    onChange={(e) => { setClienteSelId(e.target.value); setPresupuestoSel(null); }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange outline-none"
                  >
                    <option value="">-- Elige un cliente --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} {c.apellido} - {c.documento}</option>
                    ))}
                  </select>
                </div>
              </div>

              {clienteSelId && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">2. Seleccionar Presupuesto Vigente</label>
                  <div className="space-y-2">
                    {ventas.presupuestos
                      ?.filter(p => p.clientId === parseInt(clienteSelId) && ventasLogic.isBudgetVigente(p) && p.estado === 'Vigente')
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setPresupuestoSel(p); setMostrandoSelector(false); }}
                          className="w-full p-4 border border-gray-100 rounded-xl hover:border-erp-orange hover:bg-orange-50 text-left transition-all group flex justify-between items-center"
                        >
                          <div>
                            <div className="font-bold text-gray-800 group-hover:text-erp-orange">Presupuesto #{p.numero}</div>
                            <div className="text-xs text-gray-500">Total: Gs. {p.total.toLocaleString()}</div>
                          </div>
                          <Plus size={16} className="text-gray-300 group-hover:text-erp-orange" />
                        </button>
                      ))}
                    {ventas.presupuestos?.filter(p => p.clientId === parseInt(clienteSelId) && ventasLogic.isBudgetVigente(p) && p.estado === 'Vigente').length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4 italic">No hay presupuestos vigentes para este cliente.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form de confirmación Factura (cuando ya seleccionamos presupuesto) */}
      {presupuestoSel && (
        <FacturaVentaForm
          presupuesto={presupuestoSel}
          clientes={clientes}
          inventario={inventario}
          setInventario={setInventario}
          ventas={ventas}
          onCancelar={() => setPresupuestoSel(null)}
        />
      )}

      {/* Form NC */}
      {devolviendoFactura && (
        <NotaCreditoVentaForm
          factura={devolviendoFactura}
          inventario={inventario}
          setInventario={setInventario}
          ventas={ventas}
          onCancelar={() => setDevolviendoFactura(null)}
        />
      )}

      {/* Tabla pendientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex items-center gap-3">
          <Clock className="text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-800">Pendientes de cobro / Devolución</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-erp-orange uppercase text-xs">Factura</th>
                <th className="px-6 py-4 text-left font-bold text-erp-orange uppercase text-xs">Cliente</th>
                <th className="px-6 py-4 text-center font-bold text-erp-orange uppercase text-xs">Líneas</th>
                <th className="px-6 py-4 text-right font-bold text-erp-orange uppercase text-xs">Total</th>
                <th className="px-6 py-4 text-center font-bold text-erp-orange uppercase text-xs">Estado</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facturasPendientes.map((f) => {
                const cliente = clientes.find(c => c.id === f.clientId);
                const dentro48h = ventasLogic.validarDevolucion(f);
                return (
                  <tr key={f.id} className="hover:bg-orange-50/50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-lg text-gray-900">{f.numero}</div>
                      <div className="text-xs text-gray-500">{f.fechaFactura}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="font-bold">{cliente?.nombre || 'N/A'} {cliente?.apellido || ''}</span>
                      </div>
                      <span className="text-xs">{cliente?.documento}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">{f.lineas.length}</td>
                    <td className="px-6 py-4 text-right font-black text-2xl text-gray-900">
                      Gs. {f.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                        f.estado === 'Emitida' 
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {dentro48h && f.estado === 'Emitida' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDevolver(f);
                          }}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all text-sm font-bold flex items-center gap-1 mx-auto"
                          title="Devolver (48h)"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!facturasPendientes.length && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <ShoppingBag className="mx-auto w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg font-bold mb-1">No hay facturas pendientes</p>
                    <p className="text-sm">Genere desde presupuestos vigentes</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla cobradas */}
      {facturasCobradas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="text-green-500" />
              Facturas cobradas
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-green-800 uppercase text-xs">Factura</th>
                  <th className="px-6 py-4 text-left font-bold text-green-800 uppercase text-xs">Cliente</th>
                  <th className="px-6 py-4 text-right font-bold text-green-800 uppercase text-xs">Total</th>
                  <th className="px-6 py-4 text-center font-bold text-green-800 uppercase text-xs">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {facturasCobradas.slice(-5).reverse().map((f) => { // Últimas 5
                  const cliente = clientes.find(c => c.id === f.clientId);
                  return (
                    <tr key={f.id}>
                      <td className="px-6 py-4 font-mono font-bold">{f.numero}</td>
                      <td className="px-6 py-4 font-medium">{cliente?.nombre} {cliente?.apellido}</td>
                      <td className="px-6 py-4 text-right font-black">Gs. {f.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600">{f.fechaFactura}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturasVentas;

