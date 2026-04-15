import { useState } from 'react';
import { X, Save, PlusCircle, Trash2, AlertTriangle } from 'lucide-react';

/**
 * Formulario de pedido de compra: solo producto y cantidad (sin proveedor).
 * Catálogo: `inventario` del ERP (id numérico, nombre, categoria).
 */
const PedidoCompraForm = ({ inventario = [], sugeridos = [], onCancelar, onGuardarPedido }) => {
  const [items, setItems] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');

  const productoSeleccionado = inventario.find((p) => String(p.id) === String(productoId));

  const agregarItem = () => {
    if (!productoSeleccionado || !cantidad || Number(cantidad) <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productoId: productoSeleccionado.id,
        nombreProducto: productoSeleccionado.nombre,
        categoria: productoSeleccionado.categoria,
        cantidad: Number(cantidad),
      },
    ]);
    setProductoId('');
    setCantidad('');
  };

  const eliminarItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const agregarSugerido = (prod) => {
    const faltante = Math.max(0, Number(prod.min) - Number(prod.stock));
    if (faltante <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        productoId: prod.id,
        nombreProducto: prod.nombre,
        categoria: prod.categoria,
        cantidad: faltante,
      },
    ]);
  };

  const guardarPedido = () => {
    if (items.length === 0) return;
    onGuardarPedido(items);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-200 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-erp-orange p-4 flex justify-between items-center">
        <h2 className="text-white font-bold text-lg uppercase tracking-wider">Registrar pedido de compra</h2>
        <button type="button" onClick={onCancelar} className="text-white hover:bg-orange-600 rounded-full p-1">
          <X size={24} />
        </button>
      </div>

      <div className="p-6">
        {sugeridos.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2">
              <AlertTriangle size={18} />
              Productos en o bajo stock mínimo
            </p>
            <ul className="flex flex-wrap gap-2">
              {sugeridos.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => agregarSugerido(p)}
                    className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    + {p.nombre} (sugerido {Math.max(0, Number(p.min) - Number(p.stock))} u.)
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-orange-50 p-4 rounded-lg border border-orange-100">
          <div>
            <label className="block text-sm font-bold text-orange-800 mb-1">Producto</label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none bg-white"
            >
              <option value="">Seleccionar producto...</option>
              {inventario.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nombre} — {p.categoria}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-orange-800 mb-1">Cantidad</label>
            <input
              type="number"
              value={cantidad}
              min={0}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
              className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={agregarItem}
              className="w-full bg-erp-yellow text-orange-900 font-bold py-2 rounded hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} /> Añadir a la lista
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-6">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
              <tr>
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2 text-center">Cantidad</th>
                <th className="px-4 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                    No hay productos agregados al pedido
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 font-medium">{item.nombreProducto}</td>
                    <td className="px-4 py-2 text-gray-600">{item.categoria}</td>
                    <td className="px-4 py-2 text-center">{item.cantidad}</td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => eliminarItem(item.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardarPedido}
            className="px-6 py-2 bg-erp-orange text-white font-bold rounded-lg shadow-md hover:bg-orange-600 flex items-center gap-2"
          >
            <Save size={20} /> Guardar pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default PedidoCompraForm;
