import { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';

const StockForm = ({ proveedores = [], categorias = [], marcas = [], onCancelar, onGuardar }) => {
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [marcaId, setMarcaId] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('0');

  // Helper para formatear miles con puntos
  const formatNumber = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePrecioChange = (e) => {
    setPrecio(formatNumber(e.target.value));
  };

  const handleStockChange = (e) => {
    setStock(formatNumber(e.target.value));
  };

  // Auto-seleccionar el primero cuando carguen
  useEffect(() => {
    if (categorias.length > 0 && !categoriaId) setCategoriaId(categorias[0].id);
    if (marcas.length > 0 && !marcaId) setMarcaId(marcas[0].id);
  }, [categorias, marcas]);

  const handleGuardar = () => {
    if (!nombre.trim()) return alert("El nombre es obligatorio");

    onGuardar({
      nombre: nombre.trim(),
      categoriaId: categoriaId ? Number(categoriaId) : null,
      marcaId: marcaId ? Number(marcaId) : null,
      precio: precio ? Number(precio.replace(/\./g, '')) : null,
      stock: stock ? Number(stock.replace(/\./g, '')) : 0,
      esServicio: false
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-200 overflow-hidden">
      <div className="bg-erp-orange p-4 flex justify-between items-center text-white">
        <h2 className="font-bold flex items-center gap-2"><Package size={20} /> Nuevo Producto</h2>
        <button onClick={onCancelar}><X size={24} /></button>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700">Nombre del Producto</label>
          <input
            type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-erp-orange"
            placeholder="Ej: Neumático 205/55R16"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Categoría</label>
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="w-full p-2 border rounded">
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Marca</label>
            <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)} className="w-full p-2 border rounded">
              {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Cantidad actual</label>
            <input
              type="text" value={stock} onChange={handleStockChange}
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-erp-orange"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Precio Inicial (Gs.)</label>
            <input
              type="text" value={precio} onChange={handlePrecioChange}
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-erp-orange"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onCancelar} className="px-4 py-2 text-gray-500">Cancelar</button>
          <button onClick={handleGuardar} className="px-6 py-2 bg-erp-orange text-white font-bold rounded-lg shadow-md hover:bg-orange-600 flex items-center gap-2">
            <Save size={18} /> Guardar Producto
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockForm;