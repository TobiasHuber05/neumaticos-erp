import { Tag, Calendar, FileText, ArrowRight } from 'lucide-react';
import { formatGua } from '../../utils/personalLogic';

const AsientosPersonal = ({ personal }) => {
  const { asientosNomina } = personal;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-orange-50 overflow-hidden">
        <div className="p-8 border-b border-orange-50 bg-gray-50/30">
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
            <Tag className="text-erp-orange" />
            Asientos Contables - Nómina
          </h3>
          <p className="text-xs text-gray-500 font-bold uppercase mt-1">Registros generados automáticamente al cerrar periodos</p>
        </div>

        <div className="divide-y divide-orange-50">
          {asientosNomina.map((asiento) => (
            <div key={asiento.id} className="p-8 hover:bg-orange-50/10 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-erp-orange/10 text-erp-orange px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {asiento.id}
                    </span>
                    <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                      <Calendar size={12} />
                      {asiento.fecha}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-gray-800 uppercase leading-none">{asiento.descripcion}</h4>
                </div>
                <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-100 flex items-center gap-2">
                  <FileText size={16} />
                  <span className="text-sm font-black uppercase tracking-tighter">Validado</span>
                </div>
              </div>

              <div className="bg-orange-50/30 rounded-2xl overflow-hidden border border-orange-100">
                <table className="w-full text-xs">
                  <thead className="bg-orange-100/30 text-erp-orange font-black uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Cuenta Contable</th>
                      <th className="px-6 py-3 text-right">Debe</th>
                      <th className="px-6 py-3 text-right">Haber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {asiento.detalles.map((det, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 font-bold text-gray-700 flex items-center gap-2">
                          <ArrowRight size={10} className="text-erp-orange" />
                          {det.cuenta}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-800">
                          {det.debe > 0 ? formatGua(det.debe) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-800">
                          {det.haber > 0 ? formatGua(det.haber) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-white border-t-2 border-orange-100 font-black">
                    <tr>
                      <td className="px-6 py-4 text-erp-orange">TOTALES</td>
                      <td className="px-6 py-4 text-right">{formatGua(asiento.detalles.reduce((s, d) => s + d.debe, 0))}</td>
                      <td className="px-6 py-4 text-right">{formatGua(asiento.detalles.reduce((s, d) => s + d.haber, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
          {asientosNomina.length === 0 && (
            <div className="p-20 text-center text-gray-300 font-black uppercase italic">
              No hay asientos registrados
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsientosPersonal;
