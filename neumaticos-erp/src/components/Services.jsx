import { Package, Search, Clock3, Plus, Pencil, Trash2 } from 'lucide-react';
import ServicesForm from './Forms/ServicesForm';
import { useState } from 'react';
import { puedeEditar } from '../utils/permisos';
import Pagination, { usePagination } from './ModuloCompras/Pagination';

const Services = ({ servicios = [], actions }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [servicioEditando, setServicioEditando] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const guardarServicio = async (datos) => {
    if (servicioEditando) {
      await actions.actualizarServicio(servicioEditando.id, datos);
    } else {
      await actions.agregarServicio(datos);
    }
    setMostrarFormulario(false);
    setServicioEditando(null);
  };

  const ServiciosFiltrado = servicios.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return String(item.nombre).toLowerCase().includes(q);
  });

  const {
    currentPage,
    totalPages,
    currentItems: paginatedServicios,
    setCurrentPage
  } = usePagination(ServiciosFiltrado);

  if (mostrarFormulario) {
    return (
      <ServicesForm
        initialData={servicioEditando}
        onCancelar={() => {
          setMostrarFormulario(false);
          setServicioEditando(null);
        }}
        onGuardar={guardarServicio}
      />
    );
  }

  const formatPrecioGs = (valor) => {
    const n = Number(valor);
    if (isNaN(n)) return '0';
    return n.toLocaleString('de-DE');
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
      <div className="p-4 border border-gray-500 rounded-t-xl flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-2">
          <Package className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Control de Servicios</h2>
        </div>
        {puedeEditar('ventas') && (
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="flex items-center gap-2 bg-erp-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md"
          >
            <Plus size={20} />
            Nuevo servicio
          </button>
        )}
      </div>
      <div className="bg-white rounded shadow-md md:p-6 mb-6 mx-0 md:mx-0 border border-gray-500">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
            <tr>
              <th className="px-6 py-4">Servicio</th>
              <th className="px-6 py-4 text-center">Duracion Aprox.</th>
              <th className="px-6 py-4 text-right">Precio</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedServicios.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                  No se encontraron servicios.
                </td>
              </tr>
            ) : (
              paginatedServicios.map((servicio) => (
                <tr key={servicio.id} className="hover:bg-orange-50/50 transition-colors text-sm">
                  <td className="px-6 py-4 font-bold text-gray-700">{servicio.nombre}</td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    <div className="flex items-center justify-center gap-2">
                      <Clock3 size={16} className="text-erp-orange/70" />
                      <span className="font-medium">
                        {servicio.duracion_aprox && servicio.duracion_aprox !== '—'
                          ? servicio.duracion_aprox
                          : 'No definida'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-700">Gs. {formatPrecioGs(servicio.precio)}</td>
                  <td className="px-6 py-4 text-center">
                    {servicio.estado === 'Alta Demanda' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase border border-yellow-200">
                        Alta Demanda
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-600 text-[10px] font-black uppercase border border-green-200">
                        Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {puedeEditar('ventas') && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setServicioEditando(servicio); setMostrarFormulario(true); }}
                          className="p-2 hover:bg-orange-100 text-orange-600 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmEliminar(servicio)}
                          className="p-2 hover:bg-red-100 text-red-500 rounded-full transition-colors"
                          title="Ocultar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal confirmar eliminación */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar servicio?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-semibold">{confirmEliminar.nombre}</span> Estas seguro de eliminar este servicio?.
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
                  await actions.eliminarServicio(confirmEliminar.id);
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

export default Services;