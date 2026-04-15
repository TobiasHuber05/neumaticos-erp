import { useMemo, useState } from 'react';
import { ClipboardCheck, Package, AlertCircle } from 'lucide-react';
import FacturaRecepcionForm from '../Forms/FacturaRecepcionForm';
import NotaDevolucionForm from '../Forms/NotaDevolucionForm';
import NotaCreditoProveedorForm from '../Forms/NotaCreditoProveedorForm';
import { cantidadPendientePorLinea, ordenTienePendienteEntrega } from '../../utils/comprasLogic';

const OrdenesCompra = ({
  proveedores = [],
  ordenesCompra = [],
  facturasProveedor = [],
  notasDevolucion = [],
  notasCreditoProveedor = [],
  registrarFacturaYStock,
  registrarNotaDevolucion,
  registrarNotaCreditoProveedor,
}) => {
  const [ocFactura, setOcFactura] = useState(null);
  const [erroresFactura, setErroresFactura] = useState(null);
  const [facturaDevolver, setFacturaDevolver] = useState(null);
  const [ndParaNc, setNdParaNc] = useState(null);

  const nombreProv = (id) => proveedores.find((p) => p.id === id)?.nombre ?? `ID ${id}`;

  const facsPorOc = useMemo(() => {
    const m = {};
    for (const f of facturasProveedor) {
      if (f.estado !== 'Aceptada') continue;
      if (!m[f.ordenCompraId]) m[f.ordenCompraId] = [];
      m[f.ordenCompraId].push(f);
    }
    return m;
  }, [facturasProveedor]);

  const handleGuardarFactura = (payload) => {
    setErroresFactura(null);
    const res = registrarFacturaYStock(ocFactura, payload);
    if (!res.ok) {
      setErroresFactura(res.errores ?? ['No se pudo registrar la factura.']);
      return;
    }
    setOcFactura(null);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <ClipboardCheck className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Órdenes de compra</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
              <tr>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ordenesCompra.map((oc) => {
                const pendiente = ordenTienePendienteEntrega(oc, facturasProveedor);
                const pendMap = cantidadPendientePorLinea(oc, facturasProveedor);
                const resumen = (oc.lineas ?? [])
                  .map((l) => `${l.nombreProducto?.slice(0, 12)}…: ${pendMap[l.productoId] ?? 0}`)
                  .join(' · ');
                return (
                  <tr key={oc.id} className="hover:bg-orange-50/40">
                    <td className="px-4 py-3 font-bold">{oc.numero}</td>
                    <td className="px-4 py-3">{nombreProv(oc.proveedorId)}</td>
                    <td className="px-4 py-3 text-gray-600">{oc.fecha}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${
                          oc.estado === 'Cerrada'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {oc.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate" title={resumen}>
                      {pendiente ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                          <AlertCircle size={14} /> Pendiente
                        </span>
                      ) : (
                        <span className="text-green-700 font-bold">Completa</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={!pendiente}
                        onClick={() => {
                          setErroresFactura(null);
                          setOcFactura(oc);
                        }}
                        className="text-xs font-bold bg-erp-orange text-white px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Registrar factura
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!ordenesCompra.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No hay órdenes de compra. Adjudicá un pedido de cotización primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <Package className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Facturas aceptadas y devoluciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
              <tr>
                <th className="px-4 py-3">Factura</th>
                <th className="px-4 py-3">Timbrado</th>
                <th className="px-4 py-3">OC</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facturasProveedor
                .filter((f) => f.estado === 'Aceptada')
                .map((f) => {
                  const oc = ordenesCompra.find((o) => o.id === f.ordenCompraId);
                  return (
                    <tr key={f.id}>
                      <td className="px-4 py-3 font-bold">{f.numero}</td>
                      <td className="px-4 py-3 font-mono text-xs">{f.timbrado || '—'}</td>
                      <td className="px-4 py-3">{oc?.numero ?? '—'}</td>
                      <td className="px-4 py-3">{nombreProv(f.proveedorId)}</td>
                      <td className="px-4 py-3">Gs. {Number(f.total).toLocaleString('de-DE')}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                            f.estadoPago === 'Pagada'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {f.estadoPago}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setFacturaDevolver(f)}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Nota devolución
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {!facturasProveedor.filter((f) => f.estado === 'Aceptada').length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Aún no hay facturas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">Notas de devolución</h3>
          {notasDevolucion.length === 0 ? (
            <p className="text-sm text-gray-400">Sin registros.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {notasDevolucion.map((nd) => (
                <li key={nd.id} className="flex justify-between gap-2 border-b border-gray-100 pb-2">
                  <span className="font-mono font-bold">{nd.numero}</span>
                  <span className="text-gray-600 truncate">{nd.motivo}</span>
                  <button
                    type="button"
                    onClick={() => setNdParaNc(nd)}
                    className="text-erp-orange font-bold text-xs shrink-0"
                  >
                    + NC proveedor
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">Notas de crédito recibidas</h3>
          {notasCreditoProveedor.length === 0 ? (
            <p className="text-sm text-gray-400">Sin registros.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {notasCreditoProveedor.map((nc) => (
                <li key={nc.id} className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="font-mono font-bold">{nc.numero}</span>
                  <span>Gs. {Number(nc.monto).toLocaleString('de-DE')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {ocFactura && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-12 overflow-y-auto">
          <FacturaRecepcionForm
            ordenCompra={ocFactura}
            facturasExistentes={facsPorOc[ocFactura.id] ?? []}
            errorList={erroresFactura}
            onCancelar={() => {
              setOcFactura(null);
              setErroresFactura(null);
            }}
            onGuardar={handleGuardarFactura}
          />
        </div>
      )}

      {facturaDevolver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <NotaDevolucionForm
            factura={facturaDevolver}
            onCancelar={() => setFacturaDevolver(null)}
            onGuardar={(payload) => {
              registrarNotaDevolucion(facturaDevolver, payload);
              setFacturaDevolver(null);
            }}
          />
        </div>
      )}

      {ndParaNc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <NotaCreditoProveedorForm
            notaDevolucion={ndParaNc}
            onCancelar={() => setNdParaNc(null)}
            onGuardar={(payload) => {
              registrarNotaCreditoProveedor(ndParaNc, payload);
              setNdParaNc(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OrdenesCompra;
