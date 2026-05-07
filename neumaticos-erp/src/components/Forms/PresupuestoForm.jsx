import { useState, useEffect } from 'react';
import { FileText, X, User, Package, Plus, Trash2, Search, Clock } from 'lucide-react';

/**
 * Formulario para nuevo presupuesto. 
 * Props: clientes[], inventario[], onCancelar, onGuardar(lineas, clientId, total)
 */
const PresupuestoForm = ({ clientes = [], inventario = [], servicios = [], onCancelar, onGuardar }) => {
  const [clientId, setClientId] = useState('');
  const [lineas, setLineas] = useState([]);
  const [tipoItem, setTipoItem] = useState('producto'); // 'producto' | 'servicio'
  const [itemSearch, setItemSearch] = useState('');
  const [itemSelect, setItemSelect] = useState('');
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  const clienteSeleccionado = clientes.find(c => c.id === parseInt(clientId));

  const total = lineas.reduce((sum, l) => sum + l.totalLinea, 0);

  const handleAgregarLinea = () => {
    const catalogo = tipoItem === 'producto' ? inventario : servicios;
    const item = catalogo.find(i => i.id === parseInt(itemSelect));
    
    if (!item || qty <= 0) {
      setError(`Seleccione un ${tipoItem} y cantidad válida`);
      return;
    }

    // Limpiar precio (quitar puntos si es string)
    const precioLimpio = typeof item.precio === 'string' 
      ? parseInt(item.precio.replace(/\./g, '')) 
      : parseInt(item.precio);

    const totalLinea = qty * precioLimpio;
    const nuevaLinea = { 
      productoId: item.id, // Usamos siempre el id_producto para presupuestos
      tipo: tipoItem,
      nombre: item.nombre,
      cantidad: qty, 
      precioUnitario: precioLimpio, 
      totalLinea 
    };

    setLineas([...lineas, nuevaLinea]);
    setItemSearch('');
    setItemSelect('');
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

  const catalogoActual = tipoItem === 'producto' 
    ? inventario.filter(i => !i.esServicio) 
    : servicios;
  const filteredItems = catalogoActual.filter(i =>
    i.nombre.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 p-3 rounded-xl">
              <FileText className="text-orange-500 w-6 h-6" />
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
            <p className="text-xs text-gray-500 mt-2 ml-1">{clienteSeleccionado.correo}</p>
          )}
        </div>

        {/* Líneas productos */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-600 mb-4 uppercase">Productos / Servicios</label>

          {/* Tipo de Item Selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setTipoItem('producto'); setItemSelect(''); }}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all border-2 ${
                tipoItem === 'producto' 
                  ? 'bg-erp-orange border-erp-orange text-white' 
                  : 'bg-white border-gray-100 text-gray-500 hover:border-orange-200'
              }`}
            >
              <Package size={16} className="inline mr-2" />
              Productos
            </button>
            <button
              onClick={() => { setTipoItem('servicio'); setItemSelect(''); }}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all border-2 ${
                tipoItem === 'servicio' 
                  ? 'bg-erp-orange border-erp-orange text-white' 
                  : 'bg-white border-gray-100 text-gray-500 hover:border-orange-200'
              }`}
            >
              <Clock size={16} className="inline mr-2" />
              Servicios
            </button>
          </div>

          {/* Agregar línea */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-orange-50/50 rounded-2xl border-2 border-dashed border-orange-200 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                {tipoItem === 'producto' ? 'Buscar Producto' : 'Buscar Servicio'}
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder={`Filtrar ${tipoItem}...`}
                  className="w-full pl-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange text-sm transition-all"
                />
              </div>
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Seleccionar</label>
              <select
                value={itemSelect}
                onChange={(e) => setItemSelect(e.target.value)}
                className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange text-sm transition-all bg-white"
              >
                <option value="">-- Elige un {tipoItem} --</option>
                {filteredItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre} - Gs. {typeof item.precio === 'string' ? item.precio : item.precio.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Cant.</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange text-sm transition-all"
                placeholder="1"
              />
            </div>
            <button
              type="button"
              onClick={handleAgregarLinea}
              className="w-full md:w-auto px-8 h-[46px] bg-erp-orange hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Agregar
            </button>
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
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-orange-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{linea.nombre}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{linea.tipo}</div>
                        </td>
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
