import { useMemo, useState } from 'react';
import { Plus, Phone, MapPin, Users, Tag, Search, Trash2, AlertTriangle, X } from 'lucide-react';
import ProveedorForm from '../Forms/ProveedorForm';
import { useProveedores } from '../../hooks/useProveedores';
import { puedeEditar } from '../../utils/permisos';
import Pagination, { usePagination } from './Pagination';

const Proveedores = () => {
  const { proveedores, crearProveedor, actualizarProveedor, eliminarProveedor, categorias: categoriasDB } = useProveedores();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editar, setEditar] = useState(null);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [errorMsg, setErrorMsg] = useState(null);

  const categoriasDisponibles = useMemo(() => {
    // Usamos las categorías que vienen de la base de datos (nombre es .nombre en el hook)
    return categoriasDB.map(c => c.nombre).sort();
  }, [categoriasDB]);

  const proveedoresFiltrados = proveedores.filter((p) => {

    const q = searchTerm.trim().toLowerCase();
    const coincideTexto =
      !q ||
      [p.nombre, p.ruc, p.direccion]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(q));
    const cats = p.categorias ?? [];
    const coincideCategoria = filtroCategoria === 'todas' || cats.includes(filtroCategoria);
    return coincideTexto && coincideCategoria;
  });

  const guardar = async (data) => {
    setErrorMsg(null);
    const res = data.id
      ? await actualizarProveedor(data.id, data)
      : await crearProveedor(data);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Error al guardar el proveedor');
      return;
    }
    setMostrarForm(false);
    setEditar(null);
  };

  if (mostrarForm || editar) {
    return (
      <>
        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm p-3">
            {errorMsg}
          </div>
        )}
        <ProveedorForm
          initial={editar}
          categoriasDisponibles={categoriasDB}
          onCancelar={() => {
            setMostrarForm(false);
            setEditar(null);
          }}
          onGuardar={guardar}
        />
      </>
    );
  }

  return (
    <div className="bg-transparent overflow-hidden rounded-t-xl">
      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-200/40 bg-red-500/10 backdrop-blur-md text-red-900 text-sm p-4 flex justify-between items-center shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="text-red-600 shrink-0" size={20} />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-700 hover:text-red-900 font-bold hover:bg-red-500/20 p-1.5 rounded-lg transition-colors"
            aria-label="Cerrar alerta"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="p-5 border border-white/40 rounded-t-2xl flex justify-between items-center bg-white/70 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2">
          <Users className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Maestro de proveedores</h2>
        </div>
        <div className="flex gap-2">
          {puedeEditar('compras') && (
            <>
              <button
                type="button"
                onClick={() => {/* Lógica para abrir modal de gestión de categorías */ }}
                className="flex items-center gap-2 bg-white/80 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-white hover:text-gray-900 transition-all shadow-sm border border-white/60 backdrop-blur-sm"
              >
                <Tag size={20} className="text-gray-400" /> Categorías
              </button>
              <button
                type="button"
                onClick={() => setMostrarForm(true)}
                className="flex items-center gap-2 bg-erp-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md hover:scale-[1.02] active:scale-95 duration-200"
              >
                <Plus size={20} /> Nuevo proveedor
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-b-2xl shadow-lg p-6 mb-6 mx-0 md:mx-0 border border-white/45 border-t-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUC o dirección..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-erp-orange outline-none bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 sm:w-72 shrink-0">
            <Tag className="w-5 h-5 text-gray-400 shrink-0 hidden sm:block" aria-hidden />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-erp-orange outline-none bg-white/80 backdrop-blur-sm focus:bg-white text-sm font-medium text-gray-700 transition-all duration-200"
              aria-label="Filtrar por categoría"
            >
              <option value="todas">Todas las categorías</option>
              {categoriasDisponibles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        {proveedoresFiltrados.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">No hay proveedores que coincidan con la búsqueda o el filtro.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {proveedoresFiltrados.map((proveedor) => (
          <div
            key={proveedor.id}
            className="bg-white/75 backdrop-blur-md rounded-2xl shadow-md border border-white/50 hover:border-erp-orange/40 hover:bg-white/85 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{proveedor.nombre}</h3>
                  <div className="text-xs text-gray-400 font-mono">{proveedor.ruc}</div>
                </div>
                <div className="flex gap-3">
                  {puedeEditar('compras') && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditar(proveedor)}
                        className="text-erp-orange font-bold text-xs uppercase hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmarEliminarId(proveedor.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Eliminar proveedor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {(proveedor.categorias ?? []).map((c) => (
                  <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-950 border border-orange-200/50">
                    {c}
                  </span>
                ))}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} />
                  <span>{proveedor.telefono}</span>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span>{proveedor.direccion}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {confirmarEliminarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-orange-50/60 backdrop-blur-md p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar proveedor?</h3>
              <p className="text-gray-600">
                Esta acción no se puede deshacer. El proveedor y sus relaciones con categorías serán eliminados permanentemente.
              </p>
            </div>
            <div className="p-4 bg-gray-50/80 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmarEliminarId(null)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await eliminarProveedor(confirmarEliminarId);
                  if (!res.ok) {
                    setErrorMsg(res.error ?? 'Error al eliminar el proveedor');
                  } else {
                    setErrorMsg(null);
                  }
                  setConfirmarEliminarId(null);
                }}
                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-all active:scale-95"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;