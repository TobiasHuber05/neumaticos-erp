import { useState } from 'react';
import { ShoppingBag, Search, FileText, Users, RotateCcw, TrendingUp, Plus, UserPlus } from 'lucide-react';
import { useModuloVentas } from '../hooks/useModuloVentas';
import ClienteForm from './Forms/ClienteForm';
import Presupuestos from './ModuloVentas/Presupuestos';
import FacturasVentas from './ModuloVentas/FacturasVentas';
import NotasCreditoVentas from './ModuloVentas/NotasCreditoVentas';
import AsientosVentas from './ModuloVentas/AsientosVentas';

/**
 * Dashboard Ventas & Facturación.
 * Props: ventas (hook), inventario, setInventario
 * Tabs: Presupuestos | Facturas | Clientes | NC | Asientos
 */
const Ventas = ({ ventas, inventario, setInventario, defaultTab }) => {
  const [tab, setTab] = useState(defaultTab || 'presupuestos');
  const [search, setSearch] = useState('');
  const [mostrarClienteForm, setMostrarClienteForm] = useState(false);

  const totalFacturas = ventas.facturasVentas?.length || 0;
  const presupVigentes = ventas.kpis?.presupuestosVigentes || 0;
  const factPendientes = ventas.kpis?.facturasPendientes || 0;
  const totalVentas = ventas.kpis?.totalVentasMes || 0;
  const clientesCount = ventas.clientes?.length || 0;

  const filteredClientes = ventas.clientes?.filter(c =>
    `${c.nombre} ${c.apellido} ${c.documento} ${c.correo}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const tabs = [
    { id: 'presupuestos', label: 'Presupuestos', icon: FileText, count: presupVigentes },
    { id: 'facturas', label: 'Facturas', icon: ShoppingBag, count: totalFacturas },
    { id: 'clientes', label: 'Clientes', icon: Users, count: clientesCount },
    { id: 'notascredito', label: 'N. Crédito', icon: RotateCcw, count: ventas.notasCreditoVentas?.length || 0 },
    { id: 'asientos', label: 'Asientos', icon: TrendingUp, count: ventas.asientosVentas?.length || 0 },
  ];

  const renderContent = () => {
    switch (tab) {
      case 'presupuestos':
        return <Presupuestos ventas={ventas} clientes={ventas.clientes} inventario={inventario} setInventario={setInventario} />;
      case 'facturas':
        return <FacturasVentas ventas={ventas} clientes={ventas.clientes} inventario={inventario} setInventario={setInventario} />;
      case 'notascredito':
        return <NotasCreditoVentas ventas={ventas} clientes={ventas.clientes} />;
      case 'asientos':
        return <AsientosVentas ventas={ventas} />;
      case 'clientes':
        return (
          <div className="space-y-6">
            {/* Header clientes */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-erp-orange" />
                Clientes ({clientesCount})
              </h3>
              <button
                onClick={() => setMostrarClienteForm(true)}
                className="flex items-center gap-2 bg-erp-orange text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md"
              >
                <Plus size={18} />
                Nuevo Cliente
              </button>
            </div>

            {/* Tabla clientes */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs">Nombre</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs">Documento</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs">Email</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-700 uppercase text-xs">Nacimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClientes.map((c) => (
                      <tr key={c.id} className="hover:bg-orange-50">
                        <td className="px-6 py-4 font-bold">{c.nombre} {c.apellido}</td>
                        <td className="px-6 py-4 font-mono">{c.documento}</td>
                        <td className="px-6 py-4 text-sm max-w-sm truncate">{c.correo}</td>
                        <td className="px-6 py-4 text-center text-sm">{c.fechaNacimiento}</td>
                      </tr>
                    ))}
                    {filteredClientes.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-16 text-center text-gray-400">
                          <Users className="mx-auto w-16 h-16 text-gray-300 mb-4" />
                          <p className="text-lg font-bold mb-1">{search ? 'No hay coincidencias' : 'No hay clientes'}</p>
                          <p className="text-sm">{search ? 'Intente otro término' : 'Agregue el primero arriba'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-erp-orange/10 rounded-2xl">
                <ShoppingBag className="w-12 h-12 text-erp-orange" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Ventas & Facturación</h1>
                <p className="text-xl text-gray-600 mt-1">Gestione presupuestos, facturas y devoluciones</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
              <div className="bg-white p-4 rounded-xl border border-orange-100 text-center">
                <div className="text-2xl font-black text-erp-orange mb-1">{presupVigentes}</div>
                <div className="text-xs uppercase font-bold text-gray-500">Presupuestos vigentes</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-blue-100 text-center">
                <div className="text-2xl font-black text-blue-600 mb-1">{factPendientes}</div>
                <div className="text-xs uppercase font-bold text-gray-500">Facturas pendientes</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-green-100 text-center">
                <div className="text-2xl font-black text-green-600 mb-1">{totalFacturas}</div>
                <div className="text-xs uppercase font-bold text-gray-500">Total facturas</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-purple-100 text-center">
                <div className="text-2xl font-black text-purple-600 mb-1">{clientesCount}</div>
                <div className="text-xs uppercase font-bold text-gray-500">Clientes</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, presupuesto, factura..."
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-erp-orange/20 focus:border-erp-orange text-lg font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4">
            <div className="flex -space-x-px">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-bold text-sm uppercase transition-all border-t border-r border-b rounded-t-lg group ${
                    tab === t.id
                      ? 'bg-white text-erp-orange border-erp-orange shadow-sm -mb-px z-10'
                      : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-white border-gray-200'
                  }`}
                >
                  <t.icon size={16} className={`${tab === t.id ? 'text-erp-orange' : 'text-gray-400'} group-hover:text-erp-orange transition-colors`} />
                  {t.label}
                  {t.count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-black ${
                      tab === t.id ? 'bg-erp-orange/10 text-erp-orange' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="p-8">
            {renderContent()}
          </div>
        </div>

        {/* Cliente form */}
        {mostrarClienteForm && (
          <ClienteForm
            onCancelar={() => setMostrarClienteForm(false)}
            onGuardar={(nuevoCliente) => {
              ventas.actions.agregarCliente(nuevoCliente);
              setMostrarClienteForm(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Ventas;

