import { useState } from 'react';
import { PlayCircle, CheckCircle2, FileText, Users, DollarSign, Calendar, ChevronRight, Calculator, AlertCircle } from 'lucide-react';
import { formatGua } from '../../utils/personalLogic';

const NominaProceso = ({ personal }) => {
  const { procesosPago, actions, config } = personal;
  const [showConfirm, setShowConfirm] = useState(false);
  const [procesoActivo, setProcesoActivo] = useState(null);

  const handleIniciar = () => {
    const mes = new Date().toISOString().slice(0, 7); // YYYY-MM
    const fecha = new Date().toISOString().split('T')[0];
    const p = actions.iniciarProcesoPago(mes, fecha);
    setProcesoActivo(p.id);
  };

  const currentProceso = procesosPago.find(p => p.id === procesoActivo) || procesosPago[procesosPago.length - 1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-erp-orange/10 rounded-xl flex items-center justify-center text-erp-orange">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Salario Mínimo</div>
            <div className="text-xl font-black text-gray-800">{formatGua(config.salarioMinimo)}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <Calculator size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">IPS Obrero</div>
            <div className="text-xl font-black text-gray-800">{config.porcentajeIPS}%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Próximo Cierre</div>
            <div className="text-xl font-black text-gray-800">30 Abr 2026</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-orange-50 overflow-hidden">
        <div className="p-8 border-b border-orange-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
              <PlayCircle className={currentProceso?.estado === 'Abierto' ? 'text-green-500 animate-pulse' : 'text-erp-orange'} />
              Proceso Actual: {currentProceso?.periodo || 'Ninguno'}
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">Estado: {currentProceso?.estado || 'Sin iniciar'}</p>
          </div>
          <div className="flex gap-3">
            {(!currentProceso || currentProceso.estado === 'Cerrado') && (
              <button 
                onClick={handleIniciar}
                className="bg-erp-orange text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
              >
                Iniciar Nómina Mes
              </button>
            )}
            {currentProceso?.estado === 'Abierto' && (
              <>
                <button 
                  onClick={() => actions.calcularNominaMasiva(currentProceso.id)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                >
                  <Calculator size={16} />
                  Cálculo Masivo
                </button>
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Cerrar y Contabilizar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-orange-50/30 text-erp-orange text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Funcionario</th>
                <th className="px-8 py-4 text-right">Total Ingresos</th>
                <th className="px-8 py-4 text-right">Total Egresos</th>
                <th className="px-8 py-4 text-right">Neto a Cobrar</th>
                <th className="px-8 py-4 text-center">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {currentProceso?.liquidaciones.map((liq, idx) => (
                <tr key={idx} className="hover:bg-orange-50/20 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-800">{liq.funcionarioNombre}</div>
                    <div className="text-[10px] text-gray-400 font-black uppercase">Liquidación Generada</div>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-green-600">
                    {formatGua(liq.totalIngresos)}
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-red-500">
                    {formatGua(liq.totalEgresos)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="bg-orange-50 text-erp-orange px-3 py-1 rounded-lg font-black">
                      {formatGua(liq.neto)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button className="p-2 text-erp-orange hover:bg-orange-100 rounded-lg transition-colors" title="Ver Recibo">
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!currentProceso?.liquidaciones || currentProceso.liquidaciones.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                        <Calculator size={48} />
                        <p className="font-black uppercase text-sm tracking-tighter">No hay cálculos realizados en este periodo</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-8 text-center space-y-4">
                      <div className="w-20 h-20 bg-orange-100 text-erp-orange rounded-full flex items-center justify-center mx-auto">
                          <AlertCircle size={40} />
                      </div>
                      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">¿Cerrar Nómina?</h2>
                      <p className="text-gray-500 font-medium">
                          Al cerrar el proceso se generará el asiento contable de "Pago de Salarios" y los recibos quedarán disponibles para impresión. 
                          <span className="block mt-2 font-bold text-erp-orange underline">Esta acción no se puede deshacer.</span>
                      </p>
                  </div>
                  <div className="p-6 bg-gray-50 flex gap-3">
                      <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Volver</button>
                      <button 
                        onClick={() => {
                            actions.cerrarProcesoPago(currentProceso.id);
                            setShowConfirm(false);
                        }} 
                        className="flex-1 py-4 bg-erp-orange text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                      >
                        Confirmar Cierre
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default NominaProceso;
