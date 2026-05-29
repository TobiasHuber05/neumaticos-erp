import { useState } from 'react';
import { Package, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import StockForm from './Forms/StockForm';
import { useProductos } from '../hooks/useProductos';
import { puedeEditar } from '../utils/permisos';

const Stock = ({ proveedoresMaestro = [] }) => {
  const { inventario, categorias, marcas, crearProducto, eliminarProducto, loading, refetch } = useProductos();
  const [productoEditando, setProductoEditando] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Crear ────────────────────────────────────────────────────
  const guardarProducto = async (datos) => {
    const res = await crearProducto(datos);
    if (res.ok) {
      setMostrarFormulario(false);
    } else {
      alert('Error al guardar: ' + res.error);
    }
  };

  // ── Editar ───────────────────────────────────────────────────
  const guardarEdicion = async (datos) => {
    try {
      const res = await fetch(`/api/productos/${productoEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...datos, idStock: productoEditando.idStock }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Error al editar: ' + (err.error ?? 'desconocido'));
        return;
      }
      await refetch();
      setMostrarFormulario(false);
      setProductoEditando(null);
    } catch (err) {
      alert('Error al editar: ' + err.message);
    }
  };

  // ── Filtro ───────────────────────────────────────────────────
  const inventarioFiltrado = inventario.filter((item) => {
    if (item.esServicio) return false;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return [item.nombre, item.categoria].some((c) =>
      String(c).toLowerCase().includes(q),
    );
  });

  // ── Formulario (crear o editar) ──────────────────────────────
  if (mostrarFormulario) {
    return (
      <StockForm
        proveedores={proveedoresMaestro}
        categorias={categorias}
        marcas={marcas}
        initialData={productoEditando}
        onCancelar={() => {
          setMostrarFormulario(false);
          setProductoEditando(null);
        }}
        onGuardar={productoEditando ? guardarEdicion : guardarProducto}
      />
    );
  }

  // ── Vista principal ──────────────────────────────────────────
  return (
    <div className="bg-orange-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border border-gray-500 rounded-t-xl flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-2">
          <Package className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Control de existencias</h2>
        </div>
        {puedeEditar('stock') && (
          <button
            type="button"
            onClick={() => { setProductoEditando(null); setMostrarFormulario(true); }}
            className="flex items-center gap-2 bg-erp-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md"
          >
            <Plus size={20} /> Nuevo producto
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="bg-white rounded shadow-md md:p-6 mb-6 border border-gray-500">
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

      {/* Tabla */}
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
                  <th className="px-6 py-4 text-right">Precio de compra</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventarioFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-gray-400">
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
                        {item.precio == null || item.precio === '—' ? (
                          <span className="text-gray-400 font-medium">—</span>
                        ) : (
                          <>Gs. {Number(String(item.precio).replace(/\./g, '')).toLocaleString('de-DE')}</>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-700">
                        {item.precioCompra == null ? (
                          <span className="text-gray-400 font-medium">—</span>
                        ) : (
                          <>Gs. {Number(String(item.precioCompra).replace(/\./g, '')).toLocaleString('de-DE')}</>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {Number(item.stock) <= Number(item.min) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-600 text-[10px] font-black uppercase border border-red-200">
                            Reposición urgente
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-600 text-[10px] font-black uppercase border border-green-200">
                            Stock OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {puedeEditar('stock') && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => { setProductoEditando(item); setMostrarFormulario(true); }}
                              className="p-2 hover:bg-orange-100 text-orange-600 rounded-full transition-colors"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmEliminar(item)}
                              className="p-2 hover:bg-red-100 text-red-500 rounded-full transition-colors"
                              title="Ocultar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
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

      {/* Modal confirmar eliminación */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar producto?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-semibold">{confirmEliminar.nombre}</span> Estas seguro de eliminar este producto?.
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
                onClick={async () => {
                  await eliminarProducto(confirmEliminar.id);
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
    </div>
  );
};

export default Stock;
