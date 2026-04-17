import { useState } from 'react';
import { Users, Search, FileText, Briefcase, TrendingUp, UserPlus, CreditCard, ClipboardList } from 'lucide-react';
import { useModuloPersonal } from '../hooks/useModuloPersonal';
import Funcionarios from './ModuloPersonal/Funcionarios';
import NominaProceso from './ModuloPersonal/NominaProceso';
import AsientosPersonal from './ModuloPersonal/AsientosPersonal';
import ConceptosSalariales from './ModuloPersonal/ConceptosSalariales';

/**
 * Dashboard Gestión de Personas y Salarios.
 */
const Personal = ({ defaultTab }) => {
  const personal = useModuloPersonal();
  const [tab, setTab] = useState(defaultTab || 'funcionarios');
  const [search, setSearch] = useState('');

  const { funcionarios, procesosPago, asientosNomina, kpis } = personal;

  const tabs = [
    { id: 'funcionarios', label: 'Funcionarios', icon: Users, count: funcionarios.length },
    { id: 'nomina', label: 'Nómina / Pagos', icon: ClipboardList, count: procesosPago.filter(p => p.estado === 'Abierto').length },
    { id: 'asientos', label: 'Asientos Nomina', icon: TrendingUp, count: asientosNomina.length },
    { id: 'conceptos', label: 'Conceptos', icon: CreditCard, count: personal.conceptos.length },
  ];

  const renderContent = () => {
    switch (tab) {
      case 'funcionarios':
        return <Funcionarios personal={personal} />;
      case 'nomina':
        return <NominaProceso personal={personal} />;
      case 'asientos':
        return <AsientosPersonal personal={personal} />;
      case 'conceptos':
        return <ConceptosSalariales personal={personal} />;
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
                <Users className="w-12 h-12 text-erp-orange" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Gestión de Personas</h1>
                <p className="text-xl text-gray-600 mt-1">Administración de legajos, nómina y aportes IPS</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full lg:w-auto">
              <div className="bg-white p-4 rounded-xl border border-orange-100 text-center">
                <div className="text-2xl font-black text-erp-orange mb-1">{kpis.totalFuncionarios}</div>
                <div className="text-xs uppercase font-bold text-gray-500">Funcionarios Activos</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-blue-100 text-center">
                <div className="text-2xl font-black text-blue-600 mb-1">{kpis.nominaUltimoMes > 0 ? '✓' : '0'}</div>
                <div className="text-xs uppercase font-bold text-gray-500">Nómina Liquidada</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-green-100 text-center text-green-600">
                 <div className="text-2xl font-black mb-1">IPS</div>
                 <div className="text-xs uppercase font-bold text-gray-500 tracking-tighter">Aportes 9% / 16.5%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4">
            <div className="flex -space-x-px scrollbar-hide overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-bold text-sm uppercase transition-all border-t border-r border-b rounded-t-lg group whitespace-nowrap ${
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
      </div>
    </div>
  );
};

export default Personal;