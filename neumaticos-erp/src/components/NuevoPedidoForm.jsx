import { useState } from 'react';
import { X, Save, PlusCircle, Trash2 } from 'lucide-react';

const catalogoProductos = [
  {
    id: 'michelin-primacy-4',
    nombre: 'Michelin Primacy 4',
    proveedores: [
      { id: 1, nombre: 'Neumáticos del Este' },
      { id: 3, nombre: 'Distribuidora Pirelli' },
    ],
  },
  {
    id: 'pirelli-scorpion-at',
    nombre: 'Pirelli Scorpion AT',
    proveedores: [{ id: 3, nombre: 'Distribuidora Pirelli' }],
  },
  {
    id: 'bridgestone-turanza',
    nombre: 'Bridgestone Turanza',
    proveedores: [{ id: 2, nombre: 'Importadora Global S.A.' }],
  },
  {
    id: 'fate-max-senti',
    nombre: 'Fate Max Senti',
    proveedores: [
      { id: 1, nombre: 'Neumáticos del Este' },
      { id: 2, nombre: 'Importadora Global S.A.' },
    ],
  },
];

const NuevoPedidoForm = ({ onCancelar, onGuardarPedido }) => {
  const [items, setItems] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [proveedorId, setProveedorId] = useState('');

  const productoSeleccionado = catalogoProductos.find((p) => p.id === productoId);
  const proveedoresDisponibles = productoSeleccionado?.proveedores ?? [];

  const agregarItem = () => {
    if (!productoSeleccionado || !proveedorId || !cantidad || Number(cantidad) <= 0) return;
    const proveedorSeleccionado = proveedoresDisponibles.find((p) => String(p.id) === proveedorId);
    if (!proveedorSeleccionado) return;

    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productoId,
        nombreProducto: productoSeleccionado.nombre,
        cantidad: Number(cantidad),
        proveedorId: Number(proveedorId),
        proveedorNombre: proveedorSeleccionado.nombre,
      },
    ]);

    setProductoId('');
    setCantidad('');
    setProveedorId('');
  };

  const eliminarItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const guardarPedido = () => {
    if (items.length === 0) return;
    onGuardarPedido(items);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-200 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-erp-orange p-4 flex justify-between items-center">
        <h2 className="text-white font-bold text-lg uppercase tracking-wider">Registrar Pedido de Compra</h2>
        <button onClick={onCancelar} className="text-white hover:bg-orange-600 rounded-full p-1">
          <X size={24} />
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-orange-50 p-4 rounded-lg border border-orange-100">
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-orange-800 mb-1">Producto</label>
            <select
              value={productoId}
              onChange={(e) => {
                setProductoId(e.target.value);
                setProveedorId('');
              }}
              className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
            >
              <option value="">Seleccionar producto...</option>
              {catalogoProductos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
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
          <div>
            <label className="block text-sm font-bold text-orange-800 mb-1">Proveedor</label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              disabled={!productoId}
              className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {productoId ? 'Seleccionar proveedor...' : 'Primero seleccioná un producto'}
              </option>
              {proveedoresDisponibles.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
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
                <th className="px-4 py-2">Proveedor</th>
                <th className="px-4 py-2 text-center">Cantidad</th>
                <th className="px-4 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-400 italic">No hay productos agregados al pedido</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 font-medium">{item.nombreProducto}</td>
                    <td className="px-4 py-2">{item.proveedorNombre}</td>
                    <td className="px-4 py-2 text-center">{item.cantidad}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => eliminarItem(item.id)} className="text-red-500 hover:text-red-700">
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
          <button onClick={onCancelar} className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">
            Cancelar
          </button>
          <button onClick={guardarPedido} className="px-6 py-2 bg-erp-orange text-white font-bold rounded-lg shadow-md hover:bg-orange-600 flex items-center gap-2">
            <Save size={20} /> Guardar Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevoPedidoForm;