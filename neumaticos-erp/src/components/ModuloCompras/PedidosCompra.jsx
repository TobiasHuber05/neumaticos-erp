import { useState } from 'react';
import { Plus, Eye, ClipboardList, X } from 'lucide-react';

const PedidosCompra = ({ onNuevoPedido, pedidos }) => {
  const [pedidoDetalle, setPedidoDetalle] = useState(null);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Pedidos de compra de productos</h2>
        </div>
        <button
          type="button"
          onClick={onNuevoPedido}
          className="flex items-center gap-2 bg-erp-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md"
        >
          <Plus size={20} /> Nuevo pedido
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-orange-50 text-erp-orange uppercase text-sm">
            <tr>
              <th className="px-6 py-4">Número</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Cant. ítems</th>
              <th className="px-6 py-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pedidos.map((p) => (
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
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      p.estado === ESTADOS_PEDIDO_COMPRA.ADJUDICADO
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : p.estado === ESTADOS_PEDIDO_COMPRA.EN_COTIZACION
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    {p.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                          <td className="px-4 py-2">{item.nombre}</td>
                          <td className="px-4 py-2 text-center font-medium">{item.cantidad}</td>
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
    </div>
  );
};

export default PedidosCompra;
