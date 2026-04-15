import { useState, useEffect } from 'react';
import { FileText, X, User, Package, Plus, Trash2, Search } from 'lucide-react';

/**
 * Formulario para nuevo presupuesto. 
 * Props: clientes[], inventario[], onCancelar, onGuardar(lineas, clientId, total)
 */
const PresupuestoForm = ({ clientes = [], inventario = [], onCancelar, onGuardar }) => {
  const [clientId, setClientId] = useState('');
  const [lineas, setLineas] = useState([]);
  const [productoSearch, setProductoSearch] = useState('');
  const [productoSelect, setProductoSelect] = useState('');
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  const clienteSeleccionado = clientes.find(c => c.id === parseInt(clientId));

  const total = lineas.reduce((sum, l) => sum + l.totalLinea, 0);

  const handleAgregarLinea = () => {
    const producto = inventario.find(p => p.id === parseInt(productoSelect));
    if (!producto || qty <= 0) {
      setError('Producto y cantidad válidos requeridos');
      return;
    }
    const totalLinea = qty * parseInt(producto.precio);
    const nuevaLinea = { productoId: producto.id, cantidad: qty, precioUnitario: parseInt(producto.precio), totalLinea };

    setLineas([...lineas, nuevaLinea]);
    setProductoSearch('');
    setProductoSelect('');
    setQty(1);
    setError('');
  };

  const removerLinea = (index) => {
    setLineas(lineas.filter((_, i) => i !== index));
  };

  const handleGuardar = () => {
    if (!clientId || lineas.length === 0) {
      setError('Seleccione cliente y agregue al menos 1 producto');
      return;
    }
    onGuardar(lineas, parseInt(clientId), total);
  };

  const filteredProductos = inventario.filter(p =>
    p.nombre.toLowerCase().includes(productoSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <FileText className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800">Nuevo Presupuesto</h3>
              <p className="text-sm text-gray-500">Vigencia: 10 días hábiles</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 font-bold text-sm">{error}</p>
          </div>
        )}

        {/* Cliente */}
        <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
          <label className="block text-sm font-bold text-gray-600 mb-3 uppercase">Cliente</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full pl-12 pr-8 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange text-sm font-medium"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido} - {c.documento}
                </option>
              ))}
            </select>
          </div>
          {clienteSeleccionado && (
            <p className="text-xs text-gray-500 mt-2 ml-1">{clienteSeleccionado.email}</p>
          )}
        </div>

        {/* Líneas productos */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-600 mb-4 uppercase">Productos / Servicios</label>
          
          {/* Agregar línea */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 p-4 bg-blue-50/50 rounded-xl border-2 border-dashed border-blue-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={productoSearch}
                onChange={(e) => setProductoSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
            <select
              value={productoSelect}
              onChange={(e) => setProductoSelect(e.target.value)}
              className="py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 text-sm"
            >
              <option value="">Seleccionar</option>
              {filteredProductos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} - Gs. {parseInt(p.precio).toLocaleString()}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                min="1"
                className="flex-1 py-3 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 text-sm"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={handleAgregarLinea}
                className="px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all whitespace-nowrap"
              >
                <Plus size={18} className="inline mr-1" />
                Agregar
              </button>
            </div>
          </div>

          {/* Tabla líneas */}
          {lineas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Producto</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700">Cant.</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700">Precio U.</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700">Total</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea, index) => {
                    const producto = inventario.find(p => p.id === linea.productoId);
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-orange-50">
                        <td className="px-4 py-3 font-medium">{producto?.nombre || 'N/A'}</td>
                        <td className="px-4 py-3 text-center">{linea.cantidad}</td>
                        <td className="px-4 py-3 text-right">Gs. {linea.precioUnitario.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-erp-orange">
                          Gs. {linea.totalLinea.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removerLinea(index)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-erp-orange/10 font-black">
                    <td colSpan="3" className="px-4 py-4 text-right uppercase text-sm">TOTAL PRESUPUESTO</td>
                    <td className="px-4 py-4 text-right text-2xl text-erp-orange">Gs. {total.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-8 rounded-xl transition-all text-sm uppercase"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={!clientId || lineas.length === 0}
            className="flex-1 bg-erp-orange hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-black py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl text-sm uppercase flex items-center justify-center gap-2"
          >
            <FileText size={20} />
            Generar Presupuesto
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresupuestoForm;

