import { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import ClienteForm from '../Forms/ClienteForm';

const ClientesVentas = ({ ventas }) => {
  const [search, setSearch] = useState('');
  const [mostrarClienteForm, setMostrarClienteForm] = useState(false);

  const clientesCount = ventas.clientes?.length || 0;

  const filteredClientes = ventas.clientes?.filter(c =>
    `${c.nombre} ${c.apellido} ${c.documento} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header Clientes */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-erp-orange/10 rounded-xl">
            <Users className="w-8 h-8 text-erp-orange" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Clientes</h2>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Gestión de base de datos de clientes</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange/20 focus:border-erp-orange text-sm font-medium"
            />
          </div>
          <button
            onClick={() => setMostrarClienteForm(true)}
            className="flex items-center gap-2 bg-erp-orange text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md shrink-0"
          >
            <Plus size={18} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Tabla Clientes */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wider">Documento/RUC</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wider">Email</th>
                <th className="px-6 py-4 text-center font-bold text-gray-700 uppercase text-xs tracking-wider">Nacimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClientes.map((c) => (
                <tr key={c.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{c.nombre} {c.apellido}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm bg-gray-50 px-2 py-1 rounded w-fit text-gray-600">{c.documento}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-sm truncate">{c.correo}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">{c.fechaNacimiento}</td>
                </tr>
              ))}
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-gray-400">
                    <Users className="mx-auto w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-lg font-bold text-gray-400">{search ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
                    <p className="text-sm text-gray-400 mt-1">{search ? 'Intente con otro término de búsqueda' : 'Agregue su primer cliente usando el botón superior'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total: {clientesCount} clientes</span>
        </div>
      </div>

      {/* Cliente Form Modal */}
      {mostrarClienteForm && (
        <ClienteForm
          onCancelar={() => setMostrarClienteForm(false)}
          onGuardar={async (nuevoCliente) => {
            try {
              await ventas.actions.agregarCliente(nuevoCliente);
              setMostrarClienteForm(false);
            } catch (err) {
              alert(err.message); // o mostrarlo en el form
            }
          }}
        />
      )}
    </div>
  );
};

export default ClientesVentas;
