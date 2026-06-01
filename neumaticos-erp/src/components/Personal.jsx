import { useState, useEffect } from 'react';
import { Users, ClipboardList, TrendingUp, CreditCard, UserPlus, Calculator, Banknote } from 'lucide-react';
import { useModuloPersonal } from '../hooks/useModuloPersonal';

// Componentes del módulo
import FuncionariosMaestro from './ModuloPersonal/Funcionarios';
import NominaProceso from './ModuloPersonal/NominaProceso';
import AsientosPersonal from './ModuloPersonal/AsientosPersonal';
import ConceptosSalariales from './ModuloPersonal/ConceptosSalariales';
import { formatGua } from '../utils/personalLogic';

const Personal = ({ defaultTab }) => {
  const personal = useModuloPersonal();
  const { kpis } = personal;

  const [tab, setTab] = useState(defaultTab || 'funcionarios');
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/tesoreria/cuentas', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCuentas(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const tabs = [
    { id: 'funcionarios', label: 'Funcionarios', icon: Users, count: personal.funcionarios.length },
    { id: 'nomina', label: 'Nómina / Pagos', icon: ClipboardList, count: personal.procesosPago.filter(p => p.estado === 'Abierto').length },
    { id: 'asientos', label: 'Asientos Nomina', icon: TrendingUp, count: personal.procesosPago.filter(p => p.estado === 'Cerrado').length },
    { id: 'conceptos', label: 'Conceptos', icon: CreditCard, count: personal.conceptos.length },
  ];

  const renderContent = () => {
    switch (tab) {
      case 'funcionarios': return <FuncionariosMaestro personal={personal} />;
      case 'nomina': return <NominaProceso personal={personal} cuentas={cuentas} />;
      case 'asientos': return <AsientosPersonal personal={personal} />;
      case 'conceptos': return <ConceptosSalariales personal={personal} />;
      default: return <FuncionariosMaestro personal={personal} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Dashboard de Personal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-erp-orange/10 text-erp-orange rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Funcionarios Activos</p>
            <p className="text-2xl font-black text-gray-800">{kpis.totalFuncionarios}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Banknote size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nómina del Mes</p>
            <p className="text-2xl font-black text-gray-800">{formatGua(kpis.nominaUltimoMes)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calculator size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Costo Laboral Anual</p>
            <p className="text-2xl font-black text-gray-800">{formatGua(kpis.costoLaboralTotal * 12)}</p>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-orange-50 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all
              ${tab === t.id
                ? 'bg-erp-orange text-white shadow-lg shadow-orange-100'
                : 'text-gray-500 hover:bg-orange-50 hover:text-erp-orange'}`}
          >
            <t.icon size={18} />
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-erp-orange'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Área de Contenido */}
      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default Personal;