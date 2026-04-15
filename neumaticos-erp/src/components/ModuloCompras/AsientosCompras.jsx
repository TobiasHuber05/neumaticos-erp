import { BookMarked } from 'lucide-react';
import { LABELS } from '../Forms/comprasFormDefaults';

const AsientosCompras = ({ asientos = [] }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-orange-100 overflow-hidden">
      <div className="p-6 border-b bg-gray-50 flex items-center gap-2">
        <BookMarked className="text-erp-orange" />
        <div>
          <h2 className="text-xl font-bold text-gray-800">Asientos generados — Compras</h2>
          <p className="text-xs text-gray-500 mt-1">
            Tipos: <span className="font-bold text-gray-700">{LABELS.asientoCompra}</span> y{' '}
            <span className="font-bold text-gray-700">{LABELS.asientoNC}</span> (importe reflejado en Debe y Haber para
            partida doble simplificada en una línea).
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-right">Debe</th>
              <th className="px-4 py-3 text-right">Haber</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {asientos.map((a) => (
              <tr key={a.id} className="hover:bg-orange-50/40">
                <td className="px-4 py-3 font-mono font-bold">{a.numero}</td>
                <td className="px-4 py-3 text-gray-600">{a.fecha}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                      a.tipo === LABELS.asientoNC
                        ? 'bg-violet-100 text-violet-800 border-violet-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    {a.tipo}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-md">{a.descripcion}</td>
                <td className="px-4 py-3 text-right font-mono">Gs. {Number(a.debe).toLocaleString('de-DE')}</td>
                <td className="px-4 py-3 text-right font-mono">Gs. {Number(a.haber).toLocaleString('de-DE')}</td>
              </tr>
            ))}
            {!asientos.length && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Los asientos aparecerán al registrar facturas aceptadas o notas de crédito de proveedor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AsientosCompras;
