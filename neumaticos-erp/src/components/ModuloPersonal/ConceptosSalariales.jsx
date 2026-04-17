import { Settings, Plus, CheckCircle2, XCircle, Info } from 'lucide-react';

const ConceptosSalariales = ({ personal }) => {
  const { conceptos, actions } = personal;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-orange-50 overflow-hidden">
        <div className="p-8 border-b border-orange-50 bg-gray-50/30 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
              <Settings className="text-erp-orange" />
              Configuración de Conceptos
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">Defina qué ingresos y egresos afectan al IPS y a la bonificación</p>
          </div>
          <button className="bg-erp-orange text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
            <Plus size={18} />
            Nuevo Concepto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-orange-50/50 text-erp-orange text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Concepto Slarial</th>
                <th className="px-8 py-4">Tipo</th>
                <th className="px-8 py-4 text-center">Filtro IPS</th>
                <th className="px-8 py-4 text-center">Automático</th>
                <th className="px-8 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {conceptos.map((c) => (
                <tr key={c.id} className="hover:bg-orange-50/20 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-800">{c.nombre}</div>
                    <div className="text-[10px] text-gray-400 font-black uppercase">ID: {c.id.toString().padStart(3, '0')}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        c.tipo === 'Ingreso' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                        {c.esIPS ? (
                            <div className="flex items-center gap-1 text-green-600 font-black text-[10px] uppercase">
                                <CheckCircle2 size={16} /> Deducible
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-gray-400 font-black text-[10px] uppercase">
                                <XCircle size={16} /> Exento
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                        {c.automatico ? (
                             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        ) : (
                            <span className="w-2 h-2 bg-gray-200 rounded-full" />
                        )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                      <button className="text-gray-400 hover:text-erp-orange transition-colors">
                          <Settings size={18} />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex gap-4 items-start">
          <Info className="text-blue-500 shrink-0" size={24} />
          <div>
              <h4 className="font-black text-blue-900 uppercase text-sm tracking-tight mb-1">Nota sobre IPS</h4>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  Los conceptos marcados como "Deducible" sumarán para la base de cálculo del 9% obrero. 
                  La bonificación familiar por Ley no es deducible de IPS ni forma parte del salario imponible.
              </p>
          </div>
      </div>
    </div>
  );
};

export default ConceptosSalariales;
