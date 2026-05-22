import { useState } from 'react';
import { RotateCcw, User, Eye, X, Package, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Lista notas crédito ventas (devoluciones).
 * Props: ventas, clientes, inventario, servicios
 * Read-only, con modal de detalle.
 */
const NotasCreditoVentas = ({ ventas, clientes, inventario = [], servicios = [] }) => {
  const notas = ventas.notasCreditoVentas || [];
  const [ncDetalle, setNcDetalle] = useState(null);

  // Motivos que devuelven stock (verde) vs los que no (rojo)
  const motivoDevuelveStock = ['Producto equivocado', 'Cliente cambió opinión'];

  const getBadgeMotivo = (motivo) => {
    if (!motivo) return <span className="text-gray-400 italic text-xs">Sin motivo</span>;
    const devuelve = motivoDevuelveStock.includes(motivo);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
        devuelve
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}>
        {devuelve ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
        {motivo}
      </span>
    );
  };

  // Resolver nombre: primero usa el campo nombre ya enriquecido desde la DB,
  // si no, busca en inventario/servicios como fallback
  const resolverNombre = (linea) => {
    if (linea.nombre && !linea.nombre.startsWith('Producto #')) return linea.nombre;
    const id = linea.productoId;
    const found =
      inventario.find(p => p.id_producto_servicio === id || p.id === id) ||
      servicios.find(s => s.id_producto_servicio === id || s.id === id);
    return found?.nombre || found?.nombreProducto || linea.nombre || `Producto #${id}`;
  };

  return (
    <div className="space-y-4">
      {/* Modal Detalle NC */}
      {ncDetalle && (() => {
        const factura = ventas.facturasVentas?.find(f => f.id === ncDetalle.facturaId);
        const cliente = clientes.find(c => c.id === factura?.clientId);
        const lineas = ncDetalle.lineas || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b flex justify-between items-start bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2.5 rounded-xl">
                    <RotateCcw className="text-red-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800">
                      Nota de Crédito {ncDetalle.numero}
                    </h3>
                    <p className="text-sm text-gray-500">Emitida el {ncDetalle.fecha}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNcDetalle(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Info general */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <User size={11} /> Cliente
                    </p>
                    <p className="font-bold text-gray-800">
                      {cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no identificado'}
                    </p>
                    {cliente?.documento && (
                      <p className="text-xs text-gray-500 mt-0.5">RUC/CI: {cliente.documento}</p>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                      Factura Origen
                    </p>
                    <p className="font-bold text-gray-800 font-mono">
                      {factura?.numero || ncDetalle.facturaId || '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Fecha factura: {factura?.fechaFactura || '—'}</p>
                  </div>
                </div>

                {/* Motivo */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                    Motivo de Devolución
                  </p>
                  {getBadgeMotivo(ncDetalle.motivo)}
                  {ncDetalle.motivo && !motivoDevuelveStock.includes(ncDetalle.motivo) && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Producto NO repuesto al stock (defecto / daño)
                    </p>
                  )}
                  {ncDetalle.motivo && motivoDevuelveStock.includes(ncDetalle.motivo) && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Stock repuesto automáticamente
                    </p>
                  )}
                </div>

                {/* Detalle de productos devueltos */}
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Package size={11} /> Productos Devueltos ({lineas.length})
                  </p>
                  {lineas.length > 0 ? (
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold text-red-700 uppercase text-xs">Producto</th>
                            <th className="px-4 py-3 text-center font-bold text-red-700 uppercase text-xs">Cant.</th>
                            <th className="px-4 py-3 text-right font-bold text-red-700 uppercase text-xs">Precio Unit.</th>
                            <th className="px-4 py-3 text-right font-bold text-red-700 uppercase text-xs">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {lineas.map((linea, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">
                                {resolverNombre(linea)}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold">
                                {linea.cantidad}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-gray-600">
                                Gs. {linea.precioUnitario.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-red-700">
                                Gs. {linea.monto.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-red-50 border-t-2 border-red-100">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right font-black text-red-700 uppercase text-xs">
                              Total Nota de Crédito:
                            </td>
                            <td className="px-4 py-3 text-right font-black text-xl text-gray-900">
                              Gs. {ncDetalle.total.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      <Package className="mx-auto w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm">Sin detalle de productos disponible</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setNcDetalle(null)}
                  className="px-6 py-2.5 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabla principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <RotateCcw className="text-red-500 w-8 h-8" />
            <h2 className="text-xl font-bold text-gray-800">Notas de Crédito</h2>
            <span className="ml-auto text-sm font-bold text-gray-500">{notas.length} registradas</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-red-800 uppercase text-xs tracking-wide">Nro. NC</th>
                <th className="px-6 py-4 text-left font-bold text-red-800 uppercase text-xs tracking-wide">Factura Origen</th>
                <th className="px-6 py-4 text-left font-bold text-red-800 uppercase text-xs tracking-wide">Cliente</th>
                <th className="px-6 py-4 text-center font-bold text-red-800 uppercase text-xs tracking-wide">Fecha</th>
                <th className="px-6 py-4 text-right font-bold text-red-800 uppercase text-xs tracking-wide">Total</th>
                <th className="px-6 py-4 text-left font-bold text-red-800 uppercase text-xs tracking-wide">Motivo</th>
                <th className="px-6 py-4 text-center font-bold text-red-800 uppercase text-xs tracking-wide">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...notas].reverse().map((nc) => {
                const factura = ventas.facturasVentas?.find(f => f.id === nc.facturaId);
                const cliente = clientes.find(c => c.id === factura?.clientId);
                return (
                  <tr key={nc.id} className="hover:bg-red-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-red-600">{nc.numero}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{factura?.numero || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="font-medium">{cliente?.nombre} {cliente?.apellido}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{nc.fecha}</td>
                    <td className="px-6 py-4 text-right font-black text-lg text-gray-900">
                      Gs. {nc.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm italic text-gray-600 max-w-xs truncate">{nc.motivo}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setNcDetalle(nc)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Ver detalle de devolución"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {notas.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center text-gray-400">
                    <RotateCcw className="mx-auto w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg font-bold mb-2">No hay notas de crédito</p>
                    <p className="text-sm">Se generan desde facturas dentro de 48 horas</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NotasCreditoVentas;
