import { useState } from 'react';
import { Users, UserPlus, Search, Calendar, Briefcase, Trash2, Edit2, Users2, ChevronRight, Baby } from 'lucide-react';
import { formatGua } from '../../utils/personalLogic';

const Funcionarios = ({ personal }) => {
  const { funcionarios, actions } = personal;
  const [filtro, setFiltro] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const funcionariosFiltrados = funcionarios.filter(f => 
    f.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
    f.documento.includes(filtro)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar funcionario por nombre o CI..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-orange-100 focus:ring-2 focus:ring-erp-orange outline-none bg-white transition-all"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-erp-orange text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
        >
          <UserPlus size={20} />
          Nuevo Funcionario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-orange-50/50 text-erp-orange text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Datos Personales</th>
              <th className="px-6 py-4">Cargo y Salario</th>
              <th className="px-6 py-4">Núcleo Familiar</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-50">
            {funcionariosFiltrados.map((f) => (
              <tr key={f.id} className="hover:bg-orange-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-erp-orange/10 flex items-center justify-center text-erp-orange font-bold">
                      {f.nombre.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{f.nombre}</div>
                      <div className="text-xs text-gray-500 font-medium">CI: {f.documento}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase size={14} className="text-erp-orange" />
                    <span className="font-bold text-gray-700">{f.cargoActual}</span>
                  </div>
                  <div className="text-xs font-black text-erp-orange mt-1">
                    {formatGua(f.salarioBase)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {f.nucleoFamiliar.map((m, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold">
                        <Users2 size={10} />
                        {m.nombre} ({m.parentesco})
                      </span>
                    ))}
                    {f.nucleoFamiliar.length === 0 && <span className="text-xs text-gray-400 italic">Sin datos</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-orange-100 animate-in fade-in zoom-in duration-200">
                  <div className="p-8 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white">
                      <h2 className="text-2xl font-black text-erp-orange uppercase tracking-tighter">Registrar Funcionario</h2>
                      <p className="text-sm text-gray-500 font-medium">Complete los datos básicos del nuevo personal</p>
                  </div>
                  <div className="p-8 grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nombre Completo</label>
                          <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" placeholder="Ej. Juan Pérez" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Documento de Identidad</label>
                          <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" placeholder="Ej. 1.234.567" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha de Ingreso</label>
                          <input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Salario Base</label>
                          <input type="number" className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" placeholder="0" />
                      </div>
                      <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Cargo Inicial</label>
                          <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" placeholder="Ej. Vendedor" />
                      </div>
                  </div>
                  <div className="p-8 bg-gray-50 border-t border-orange-50 flex justify-end gap-3">
                      <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                      <button onClick={() => setShowForm(false)} className="px-8 py-3 bg-erp-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">Guardar Registro</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Funcionarios;
