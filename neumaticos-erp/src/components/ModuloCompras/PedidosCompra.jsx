import { useState } from 'react';
import { Plus, Eye, ClipboardList, X, Pencil, Trash2, Save, PlusCircle, AlertTriangle } from 'lucide-react';
import { ESTADOS_PEDIDO_COMPRA } from '../Forms/comprasFormDefaults';
import { puedeEditar } from '../../utils/permisos';
import Pagination, { usePagination } from './Pagination';

const PedidosCompra = ({ onNuevoPedido, pedidos, onEditarPedido, onEliminarPedido, inventario = [] }) => {
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');

  const {
    currentPage,
    totalPages,
    currentItems: currentPedidos,
    setCurrentPage
  } = usePagination(pedidos);

  const abrirEditar = (p) => {
    setPedidoEditando(p);
    setEditItems((p.items ?? []).map(i => ({ ...i, id: i.id ?? Date.now() + Math.random() })));
    setProductoId('');
    setCantidad('');
  };

  const agregarItemEdit = () => {
    const prod = inventario.find(p => String(p.id) === String(productoId));
    if (!prod || !cantidad || Number(cantidad) <= 0) return;
    setEditItems(prev => [
      ...prev,
      { id: Date.now(), productoId: prod.id, nombreProducto: prod.nombre, categoria: prod.categoria, cantidad: Number(cantidad) },
    ]);
    setProductoId('');
    setCantidad('');
  };

  const guardarEdicion = () => {
    if (!editItems.length) return;
    onEditarPedido?.(pedidoEditando.id, editItems);
    setPedidoEditando(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Pedidos de compra de productos</h2>
        </div>
        {puedeEditar('compras') && (
          <button
            type="button"
            onClick={onNuevoPedido}
            className="flex items-center gap-2 bg-erp-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md"
          >
            <Plus size={20} /> Nuevo pedido
          </button>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left">
        <thead className="bg-orange-50 text-erp-orange uppercase text-sm">
            <tr>
              <th className="px-6 py-4">Número</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Cant. ítems</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentPedidos.map((p) => (
              <tr key={p.id} className="hover:bg-orange-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-700">{p.numero ?? `#${p.id}`}</td>
                <td className="px-6 py-4 text-gray-600">{p.fecha}</td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>{p.items?.length ?? p.productos} productos</span>
                    <button
                      type="button"
                      onClick={() => setPedidoDetalle(p)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Ver ítems del pedido"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${p.estado === ESTADOS_PEDIDO_COMPRA.ADJUDICADO
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : p.estado === ESTADOS_PEDIDO_COMPRA.EN_COTIZACION
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}
                  >
                    {p.estado}
                  </span>
                </td>
                {puedeEditar('compras') && p.estado === ESTADOS_PEDIDO_COMPRA.PENDIENTE_COTIZACION && (
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEditar(p)}
                        className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
                        title="Editar pedido"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmEliminar(p)}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                        title="Eliminar pedido"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
                {(!puedeEditar('compras') || p.estado !== ESTADOS_PEDIDO_COMPRA.PENDIENTE_COTIZACION) && (
                  <td className="px-4 py-4" />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {pedidoDetalle && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-orange-100 overflow-hidden">
            <div className="bg-erp-orange p-4 flex items-center justify-between">
              <h3 className="text-white font-bold">Ítems del pedido {pedidoDetalle.numero ?? pedidoDetalle.id}</h3>
              <button
                type="button"
                onClick={() => setPedidoDetalle(null)}
                className="text-white hover:bg-orange-600 rounded-full p-1"
                title="Cerrar detalle"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {!pedidoDetalle.items || pedidoDetalle.items.length === 0 ? (
                <p className="text-sm text-gray-500">Este pedido no tiene ítems cargados.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 text-gray-600 uppercase">
                      <tr>
                        <th className="px-4 py-2">Producto</th>
                        <th className="px-4 py-2">Categoría</th>
                        <th className="px-4 py-2 text-center">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pedidoDetalle.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 font-medium">{item.nombreProducto}</td>
                          <td className="px-4 py-2">{item.categoria}</td>
                          <td className="px-4 py-2 text-center font-bold text-erp-orange">{item.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {confirmEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar pedido?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Se eliminará el pedido <span className="font-semibold">{confirmEliminar.numero}</span> y todos sus ítems. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmEliminar(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onEliminarPedido?.(confirmEliminar.id);
                  setConfirmEliminar(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Pedido */}
      {pedidoEditando && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-orange-200 w-full max-w-2xl overflow-hidden">
            <div className="bg-erp-orange p-4 flex justify-between items-center">
              <h2 className="text-white font-bold">Editar pedido {pedidoEditando.numero}</h2>
              <button type="button" onClick={() => setPedidoEditando(null)} className="text-white hover:bg-orange-600 rounded-full p-1">
                <X size={22} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Agregar ítems */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div>
                  <label className="block text-xs font-bold text-orange-800 mb-1">Producto</label>
                  <select
                    value={productoId}
                    onChange={e => setProductoId(e.target.value)}
                    className="w-full p-2 border border-orange-200 rounded text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {inventario.filter(p => !p.esServicio).map(p => (
                      <option key={p.id} value={String(p.id)}>{p.nombre} — {p.categoria}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-orange-800 mb-1">Cantidad</label>
                  <input
                    type="number" min={1} value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                    className="w-full p-2 border border-orange-200 rounded text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={agregarItemEdit}
                    className="w-full py-2 bg-erp-orange text-white font-bold rounded hover:bg-orange-600 flex items-center justify-center gap-1 text-sm"
                  >
                    <PlusCircle size={16} /> Agregar
                  </button>
                </div>
              </div>
              {/* Lista de ítems */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-orange-50 text-erp-orange uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2">Producto</th>
                      <th className="px-4 py-2">Categoría</th>
                      <th className="px-4 py-2 text-center">Cantidad</th>
                      <th className="px-4 py-2 text-right">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {editItems.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 italic">Sin ítems</td></tr>
                    ) : editItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 font-medium">{item.nombreProducto}</td>
                        <td className="px-4 py-2 text-gray-500">{item.categoria}</td>
                        <td className="px-4 py-2 text-center font-bold text-erp-orange">{item.cantidad}</td>
                        <td className="px-4 py-2 text-right">
                          <button type="button" onClick={() => setEditItems(p => p.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setPedidoEditando(null)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
                <button
                  type="button"
                  onClick={guardarEdicion}
                  disabled={!editItems.length}
                  className="px-4 py-2 bg-erp-orange text-white font-bold rounded-lg flex items-center gap-2 text-sm disabled:opacity-40"
                >
                  <Save size={16} /> Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosCompra;
