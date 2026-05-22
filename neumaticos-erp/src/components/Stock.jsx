import { useState } from 'react';
import { Package, Search, Plus } from 'lucide-react';
import StockForm from './Forms/StockForm';
import { useProductos } from '../hooks/useProductos';
import { puedeEditar } from '../utils/permisos';

const Stock = ({ proveedoresMaestro = [] }) => {
  // ✅ CORRECCIÓN 1: Se agregó 'marcas' a la desestructuración del hook
  const { inventario, categorias, marcas, crearProducto, eliminarProducto, loading } = useProductos();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const guardarProducto = async ({ nombre, categoriaId, precio, marcaId, esServicio, stock }) => {
    // Aquí enviamos los datos al backend mediante el hook
    const res = await crearProducto({ nombre, categoriaId, precio, marcaId, esServicio, stock });
    if (res.ok) {
      setMostrarFormulario(false);
    } else {
      alert("Error al guardar: " + res.error);
    }
  };

  const inventarioFiltrado = inventario.filter((item) => {
    // Solo mostramos productos que NO son servicios en el Control de Existencias
    if (item.esServicio) return false;

    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;

    // Filtramos por nombre del producto o nombre de categoría
    return [item.nombre, item.categoria].some((campo) =>
      String(campo).toLowerCase().includes(q)
    );
  });

  if (mostrarFormulario) {
    return (
      <StockForm
        proveedores={proveedoresMaestro}
        categorias={categorias}
        marcas={marcas} // ✅ CORRECCIÓN 2: Ahora pasamos las marcas al formulario
        onCancelar={() => setMostrarFormulario(false)}
        onGuardar={guardarProducto}
      />
    );
  }

  return (
    <div className="bg-orange-50 overflow-hidden">
      <div className="p-4 border border-gray-500 rounded-t-xl flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-2">
          <Package className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Control de existencias</h2>
        </div>
        {puedeEditar('stock') && (
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="flex items-center gap-2 bg-erp-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md"
          >
            <Plus size={20} />
            Nuevo producto
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow-md md:p-6 mb-6 mx-0 md:mx-0 border border-gray-500">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-500">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-400 py-10">Cargando productos...</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-center">Stock actual</th>
                  <th className="px-6 py-4 text-center">Stock mín.</th>
                  <th className="px-6 py-4 text-right">Precio unitario</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventarioFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : (
                  inventarioFiltrado.map((item) => (
                    <tr key={item.id} className="hover:bg-orange-50/50 transition-colors text-sm">
                      <td className="px-6 py-4 font-bold text-gray-700">{item.nombre}</td>
                      <td className="px-6 py-4 text-gray-600">{item.categoria}</td>
                      <td className="px-6 py-4 text-center font-bold">
                        {Number(item.stock).toLocaleString('de-DE')}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-400">
                        {Number(item.min).toLocaleString('de-DE')}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-700">
                        {item.precio === '—' || item.precio == null ? (
                          <span className="text-gray-400 font-medium">—</span>
                        ) : (
                          <>Gs. {Number(item.precio.toString().replace(/\./g, '')).toLocaleString('de-DE')}</>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {Number(item.stock) <= Number(item.min) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-600 text-[10px] font-black uppercase border border-red-200">
                            Reposición urgente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-600 text-[10px] font-black uppercase border border-green-200">
                            Stock OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stock;