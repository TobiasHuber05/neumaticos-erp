import { useState } from 'react';
import { ShoppingBag, Clock, CheckCircle, RotateCcw, User, Eye, X, FileText, Banknote } from 'lucide-react';
import NotaCreditoVentaForm from '../Forms/NotaCreditoVentaForm';
import CobroFacturaForm from '../Forms/CobroFacturaForm';
import * as ventasLogic from '../../utils/ventasLogic.js';
import { puedeEditar } from '../../utils/permisos';

/**
 * Lista facturas ventas, NC si <48h.
 * Props: ventas, clientes, inventario, setInventario
 */
const FacturasVentas = ({
  ventas,
  clientes,
  inventario,
  setInventario,
  servicios = [],
  cuentas = [],
  mediosCobro = [],
  registrarCobro,
  onCobroRegistrado,
}) => {
  const [devolviendoFactura, setDevolviendoFactura] = useState(null);
  const [facturaDetalle, setFacturaDetalle] = useState(null);
  const [cobrandoFactura, setCobrandoFactura] = useState(null);
  const [msg, setMsg] = useState(null);

  const facturasPendientes = ventas.facturasVentas?.filter(
    (f) => f.estado !== 'Cobrado' && Number(f.saldoPendiente ?? f.total) > 0,
  ) || [];
  const facturasCobradas = ventas.facturasVentas?.filter(f => f.estado === 'Cobrado') || [];

  const handleDevolver = (factura) => {
    if (ventasLogic.validarDevolucion(factura)) {
      setDevolviendoFactura(factura);
    }
  };

  const registrar = async (payload) => {
    const res = await registrarCobro?.(payload);
    if (!res?.ok) {
      setMsg(res?.error ?? 'Error al registrar el cobro');
      return;
    }
    setMsg(`Cobro ${res.cobranza?.nroRecibo ?? ''} registrado correctamente.`);
    setCobrandoFactura(null);
    await onCobroRegistrado?.();
  };

  return (
    <div className="space-y-8">
      {msg && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm p-3 flex justify-between items-center">
          {msg}
          <button type="button" className="text-xs underline" onClick={() => setMsg(null)}>
            Cerrar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center bg-white p-6 rounded-xl shadow-sm border border-orange-100 mb-8">
        <div className="flex items-center gap-3">
          <ShoppingBag className="text-erp-orange w-8 h-8" />
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Facturas de Venta</h2>
        </div>
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



      {/* Form NC */}
      {cobrandoFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <CobroFacturaForm
            factura={cobrandoFactura}
            clienteNombre={(() => {
              const c = clientes.find((cl) => cl.id === cobrandoFactura.clientId);
              return c ? `${c.nombre} ${c.apellido ?? ''}`.trim() : 'Cliente';
            })()}
            mediosOpciones={mediosCobro}
            cuentas={cuentas}
            onCancelar={() => setCobrandoFactura(null)}
            onGuardar={registrar}
          />
        </div>
      )}

      {devolviendoFactura && (
        <NotaCreditoVentaForm
          factura={devolviendoFactura}
          inventario={inventario}
          servicios={servicios}
          setInventario={setInventario}
          ventas={ventas}
          onCancelar={() => setDevolviendoFactura(null)}
        />
      )}

      {/* Modal Detalle Factura */}
      {facturaDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="text-erp-orange w-6 h-6" />
                <div>
                  <h3 className="text-xl font-black text-gray-800">Factura Nro. {facturaDetalle.numero}</h3>
                  <p className="text-sm text-gray-500">Emitida el {facturaDetalle.fechaFactura}</p>
                </div>
              </div>
              <button 
                onClick={() => setFacturaDetalle(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100 flex items-center gap-3">
                <User className="text-erp-orange" />
                <div>
                  <p className="text-sm font-bold text-gray-800">Cliente</p>
                  <p className="text-gray-600">
                    {clientes.find(c => c.id === facturaDetalle.clientId)?.nombre} {clientes.find(c => c.id === facturaDetalle.clientId)?.apellido}
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-gray-800 mb-3 uppercase text-xs tracking-wider">Detalle de Productos</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase text-xs">Producto</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase text-xs">Cant.</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase text-xs">Precio Unit.</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase text-xs">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {facturaDetalle.lineas.map((linea, idx) => {
                      const nombreProducto = (inventario.find(p => p.id_producto_servicio === linea.productoId) ||
                        servicios.find(s => s.id_producto_servicio === linea.productoId) ||
                        inventario.find(p => p.id === linea.productoId))?.nombre || 'Producto Desconocido';
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{nombreProducto}</td>
                          <td className="px-4 py-3 text-center font-mono">{linea.cantidad}</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600">Gs. {linea.precioUnitario.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">Gs. {linea.totalLinea.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-orange-50 border-t">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-bold text-erp-orange uppercase text-xs">Total Factura:</td>
                      <td className="px-4 py-3 text-right font-black text-lg text-gray-900">Gs. {facturaDetalle.total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setFacturaDetalle(null)}
                className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
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
                <th className="w-48"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...facturasPendientes].reverse().map((f) => {
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
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${f.estado === 'Emitida'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center flex flex-col gap-2 items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFacturaDetalle(f);
                        }}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg transition-all text-xs font-bold flex items-center gap-2 mx-auto whitespace-nowrap border border-blue-200"
                      >
                        <Eye size={14} />
                        Ver detalle
                      </button>
                      {puedeEditar('ventas') && f.estado !== 'Cobrado' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCobrandoFactura(f);
                          }}
                          className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg transition-all text-xs font-bold flex items-center gap-2 mx-auto whitespace-nowrap border border-green-200"
                        >
                          <Banknote size={14} />
                          Registrar cobro
                        </button>
                      )}
                      {puedeEditar('ventas') &&
                        (dentro48h && (f.estado === 'Emitida' || f.estado === 'Con NC Parcial')) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDevolver(f);
                          }}
                          className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg transition-all text-xs font-bold flex items-center gap-2 mx-auto whitespace-nowrap border border-red-200"
                        >
                          <RotateCcw size={14} />
                          Nota de devolución
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
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFacturaDetalle(f);
                          }}
                          className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
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

