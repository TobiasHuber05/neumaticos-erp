import { Package, Search, Clock3, Plus } from 'lucide-react';
import ServicesForm from './Forms/ServicesForm';
import { useState } from 'react';

const Services = ({ servicios = [], actions }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const guardarServicio = (datos) => {
    actions.agregarServicio(datos);
    setMostrarFormulario(false);
  };

  const ServiciosFiltrado = servicios.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return String(item.nombre).toLowerCase().includes(q);
  });

  if (mostrarFormulario) {
    return (
      <ServicesForm
        onCancelar={() => setMostrarFormulario(false)}
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
        <button
          type="button"
          onClick={() => setMostrarFormulario(true)}
          className="flex items-center gap-2 bg-erp-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md"
        >
          <Plus size={20} />
          Nuevo servicio
        </button>
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

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
            <tr>
              <th className="px-6 py-4">Servicio</th>
              <th className="px-6 py-4 text-center">Duracion Aprox.</th>
              <th className="px-6 py-4 text-right">Precio</th>
              <th className="px-6 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ServiciosFiltrado.map((servicio) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Services;