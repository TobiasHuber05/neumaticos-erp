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

    // Validación de stock solo para productos físicos
    if (tipoItem === 'producto') {
      const stockDisponible = Number(item.stock) || 0;
      // Sumar la cantidad que ya está en el presupuesto para este mismo producto
      const yaEnPresupuesto = lineas
        .filter(l => l.productoId === item.id)
        .reduce((sum, l) => sum + l.cantidad, 0);
      const totalSolicitado = yaEnPresupuesto + qty;

      if (totalSolicitado > stockDisponible) {
        const restante = stockDisponible - yaEnPresupuesto;
        setError(
          `Stock insuficiente para "${item.nombre}". Disponible: ${stockDisponible}${yaEnPresupuesto > 0 ? ` (ya tiene ${yaEnPresupuesto} en este presupuesto, puede agregar hasta ${restante} más)` : ''}.`
        );
        return;
      }

      if (stockDisponible === 0) {
        setError(`El producto "${item.nombre}" no tiene stock disponible.`);
        return;
      }
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
    <div className="w-full bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-4 lg:p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 p-2 rounded-xl">
              <FileText className="text-orange-500 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800">Nuevo Presupuesto</h3>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Vigencia: 10 días hábiles</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 font-bold text-sm">{error}</p>
          </div>
        )}

        {/* Cliente y Tipo Item */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl border border-gray-100">
            <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Cliente</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-erp-orange text-sm font-medium"
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellido} - {c.documento}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-100">
            <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Tipo de Item</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setTipoItem('producto'); setItemSelect(''); }}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all border-2 ${tipoItem === 'producto'
                  ? 'bg-gray-500 border-gray-500 text-white'
                  : 'bg-white border-gray-100 text-gray-500 hover:border-orange-200'
                  }`}
              >
                <Package size={14} className="inline mr-1" />
                Productos
              </button>
              <button
                onClick={() => { setTipoItem('servicio'); setItemSelect(''); }}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all border-2 ${tipoItem === 'servicio'
                  ? 'bg-gray-500 border-gray-500 text-white'
                  : 'bg-white border-gray-100 text-gray-500 hover:border-orange-200'
                  }`}
              >
                <Clock size={14} className="inline mr-1" />
                Servicios
              </button>
            </div>
          </div>
        </div>

        {/* Agregar línea */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6 p-4 rounded-xl border-2 border-dashed border-orange-200 items-end">
          <div className="md:col-span-4 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
              {tipoItem === 'producto' ? 'Buscar Producto' : 'Buscar Servicio'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder={`Filtrar ${tipoItem}...`}
                className="w-full pl-9 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-erp-orange text-sm transition-all"
              />
            </div>
          </div>
          <div className="md:col-span-4 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Seleccionar</label>
            <select
              value={itemSelect}
              onChange={(e) => setItemSelect(e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-erp-orange text-sm transition-all bg-white"
            >
              <option value="">-- Elige un {tipoItem} --</option>
              {filteredItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre} - Gs. {typeof item.precio === 'string' ? item.precio : item.precio.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Cant.</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-erp-orange text-sm transition-all text-center"
              placeholder="1"
            />
          </div>
          <button
            type="button"
            onClick={handleAgregarLinea}
            className="md:col-span-2 px-4 h-[38px] bg-erp-orange hover:bg-orange-600 text-white font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={18} />
            Agregar
          </button>
        </div>

        {/* Tabla líneas */}
        {lineas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-700">Producto</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-700">Cant.</th>
                  <th className="px-3 py-2 text-right font-bold text-gray-700">Precio U.</th>
                  <th className="px-3 py-2 text-right font-bold text-gray-700">Total</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, index) => {
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-xs">{linea.nombre}</div>
                        <div className="text-[9px] text-gray-400 uppercase font-bold">{linea.tipo}</div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs">{linea.cantidad}</td>
                      <td className="px-3 py-2 text-right text-xs">Gs. {linea.precioUnitario.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-xs">
                        Gs. {linea.totalLinea.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removerLinea(index)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-erp-orange/5 font-black">
                  <td colSpan="3" className="px-3 py-3 text-right uppercase text-[10px]">TOTAL PRESUPUESTO</td>
                  <td className="px-3 py-3 text-right text-xl text-erp-orange font-black">Gs. {total.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}


        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all text-xs uppercase"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={!clientId || lineas.length === 0}
            className="flex-1 bg-erp-orange hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl text-xs uppercase flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            Generar Presupuesto
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresupuestoForm;
