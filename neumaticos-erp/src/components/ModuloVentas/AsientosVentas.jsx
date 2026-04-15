import { FileText, TrendingUp } from 'lucide-react';

/**
 * Lista asientos contables ventas (facturas/NC). Read-only.
 * Props: ventas
 */
const AsientosVentas = ({ ventas }) => {
  const asientos = ventas.asientosVentas || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <TrendingUp className="text-erp-orange w-10 h-10" />
        <div>
          <h2 className="text-xl font-bold text-gray-800">Asientos Contables - Ventas</h2>
          <p className="text-sm text-gray-600">Facturas emitidas y notas crédito automáticas</p>
        </div>
        <span className="ml-auto text-sm font-bold text-gray-500">{asientos.length} asientos</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs">Fecha</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs">Tipo / Doc</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs">Descripción</th>
                <th className="px-6 py-4 text-right font-bold text-gray-700 uppercase text-xs">Debe</th>
                <th className="px-6 py-4 text-right font-bold text-gray-700 uppercase text-xs">Haber</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs">Cuenta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {asientos.slice(-20).reverse().map((a) => ( // Últimos 20
                <tr key={a.id} className={`hover:bg-gray-50 ${a.tipo === 'Nota Crédito' ? 'bg-red-50/50' : ''}`}>
                  <td className="px-6 py-4 text-sm font-mono">{a.fecha}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      a.tipo === 'Factura Emitida' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {a.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm max-w-md truncate" title={a.descripcion}>{a.descripcion}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-green-600">
                    Gs. {a.debe.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-red-600">
                    Gs. {a.haber.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm italic">{a.cuenta}</td>
                </tr>
              ))}
              {asientos.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-gray-400">
                    <FileText className="mx-auto w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg font-bold mb-2">No hay asientos contables</p>
                    <p className="text-sm">Se generan automáticamente al facturar o devolver</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AsientosVentas;

