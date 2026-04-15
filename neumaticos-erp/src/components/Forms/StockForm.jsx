import { useState } from 'react';
import { X, Save, Package } from 'lucide-react';
import { CATEGORIAS_PRODUCTO } from '../../data/erpInitialData';

const formatPrecioGs = (valor) => {
  const limpio = String(valor).replace(/\./g, '').replace(/,/g, '').trim();
  const n = Number(limpio);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toLocaleString('de-DE');
};

const StockForm = ({ proveedores = [], categoriasProducto = CATEGORIAS_PRODUCTO, onCancelar, onGuardar }) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(categoriasProducto[0] ?? CATEGORIAS_PRODUCTO[0]);
  const [proveedorId, setProveedorId] = useState('');
  const [precio, setPrecio] = useState('');

  const proveedorSeleccionado = proveedorId !== '';

  const handleGuardar = () => {
    const nombreTrim = nombre.trim();
    if (!nombreTrim) return;
    if (proveedorSeleccionado) {
      const formateado = formatPrecioGs(precio);
      if (formateado === null) return;
      const prov = proveedores.find((p) => String(p.id) === proveedorId);
      onGuardar({
        nombre: nombreTrim,
        categoria,
        proveedorId: Number(proveedorId),
        proveedorNombre: prov?.nombre ?? '',
        precio: formateado,
      });
    } else {
      onGuardar({
        nombre: nombreTrim,
        categoria,
        proveedorId: null,
        proveedorNombre: '',
        precio: null,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-200 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-erp-orange p-4 flex justify-between items-center">
        <h2 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
          <Package size={20} />
          Nuevo producto en stock
        </h2>
        <button
          type="button"
          onClick={onCancelar}
          className="text-white hover:bg-orange-600 rounded-full p-1"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-orange-50 p-4 rounded-lg border border-orange-100">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-orange-800 mb-1">Nombre del producto</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Michelin Primacy 4"
              className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-orange-800 mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none bg-white"
            >
              {categoriasProducto.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-orange-800 mb-1">Proveedor</label>
            <select
              value={proveedorId}
              onChange={(e) => {
                setProveedorId(e.target.value);
                if (!e.target.value) setPrecio('');
              }}
              className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none bg-white"
            >
              <option value="">Sin proveedor (opcional)</option>
              {proveedores.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          {proveedorSeleccionado && (
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-orange-800 mb-1">
                Precio unitario (Gs.) — según proveedor
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 1200000 o 1.200.000"
                className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
              />
              <p className="mt-1 text-xs text-orange-700/80">
                Ingresá el precio acordado con el proveedor seleccionado.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="px-6 py-2 bg-erp-orange text-white font-bold rounded-lg shadow-md hover:bg-orange-600 flex items-center gap-2"
          >
            <Save size={20} />
            Guardar en stock
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockForm;
