import { RotateCcw, Calendar, FileText, User } from 'lucide-react';

/**
 * Lista notas crédito ventas (devoluciones).
 * Props: ventas, clientes
 * Read-only, simple table.
 */
const NotasCreditoVentas = ({ ventas, clientes }) => {
  const notas = ventas.notasCreditoVentas || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <RotateCcw className="text-red-500 w-8 h-8" />
          <h2 className="text-xl font-bold text-gray-800">Notas de Crédito</h2>
          <span className="ml-auto text-sm font-bold text-gray-500">{notas.length} registradas</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-red-50">
            <tr>
              <th className="px-6 py-4 text-left font-bold text-red-800 uppercase text-xs tracking-wide">Nro. NC</th>
              <th className="px-6 py-4 text-left font-bold text-red-800 uppercase text-xs tracking-wide">Factura Origen</th>
              <th className="px-6 py-4 text-left font-bold text-red-800 uppercase text-xs tracking-wide">Cliente</th>
              <th className="px-6 py-4 text-center font-bold text-red-800 uppercase text-xs tracking-wide">Fecha</th>
              <th className="px-6 py-4 text-right font-bold text-red-800 uppercase text-xs tracking-wide">Total</th>
              <th className="px-6 py-4 text-left font-bold text-red-800 uppercase text-xs tracking-wide">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...notas].reverse().map((nc) => {
              const cliente = clientes.find(c => c.id === ventas.facturasVentas?.find(f => f.id === nc.facturaId)?.clientId);
              const factura = ventas.facturasVentas?.find(f => f.id === nc.facturaId);
              return (
                <tr key={nc.id} className="hover:bg-red-50/50">
                  <td className="px-6 py-4 font-mono font-bold text-red-600">{nc.numero}</td>
                  <td className="px-6 py-4 font-mono text-sm">{factura?.numero}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <span>{cliente?.nombre} {cliente?.apellido}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm">{nc.fecha}</td>
                  <td className="px-6 py-4 text-right font-black text-lg">Gs. {nc.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm italic text-gray-600 max-w-xs truncate">{nc.motivo}</td>
                </tr>
              );
            })}
            {notas.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-20 text-center text-gray-400">
                  <RotateCcw className="mx-auto w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-lg font-bold mb-2">No hay notas de crédito</p>
                  <p className="text-sm">Se generan desde facturas dentro de 48 horas</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotasCreditoVentas;

