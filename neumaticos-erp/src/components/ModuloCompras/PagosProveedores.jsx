import { useState, useMemo } from 'react';
import { Banknote } from 'lucide-react';
import OrdenPagoProveedoresForm from '../Forms/OrdenPagoProveedoresForm';
import { puedeEditar } from '../../utils/permisos';
import Pagination, { usePagination } from './Pagination';

const PagosProveedores = ({
  proveedores = [],
  facturasProveedor = [],
  ordenesPagoProveedores = [],
  mediosPago = [],
  cuentas = [],
  registrarOrdenPago,
  onPagoRegistrado,
}) => {
  const [proveedorId, setProveedorId] = useState('');
  const [modal, setModal] = useState(false);

  const { currentPage: curPagePagos, totalPages: totPagesPagos, currentItems: currentPagos, setCurrentPage: setCurPagePagos } = usePagination(ordenesPagoProveedores);
  const [msg, setMsg] = useState(null);

  const nombreProv = (id) => proveedores.find((p) => p.id === id)?.nombre ?? '';

  const proveedoresConDeuda = useMemo(() => {
    const pendientes = facturasProveedor.filter(
      (f) => f.estado === 'Aceptada' && f.estadoPago !== 'Pagada' && Number(f.saldoPendiente ?? f.total) > 0,
    );
    const mapa = {};
    for (const f of pendientes) {
      if (!mapa[f.proveedorId]) {
        mapa[f.proveedorId] = { proveedorId: f.proveedorId, totalDeuda: 0, cantidadFacturas: 0 };
      }
      mapa[f.proveedorId].totalDeuda += Number(f.saldoPendiente ?? f.total);
      mapa[f.proveedorId].cantidadFacturas++;
    }
    return Object.values(mapa).sort((a, b) => b.totalDeuda - a.totalDeuda);
  }, [facturasProveedor]);

  const facturasPendientes = facturasProveedor.filter(
    (f) =>
      f.estado === 'Aceptada' &&
      f.estadoPago !== 'Pagada' &&
      Number(f.saldoPendiente ?? f.total) > 0 &&
      f.proveedorId === Number(proveedorId),
  );

  const registrar = async (payload) => {
    const res = await registrarOrdenPago({ ...payload, proveedorId: Number(proveedorId) });
    if (!res?.ok) {
      setMsg(res?.error ?? 'Error al registrar el pago');
      return;
    }

    setMsg(`Orden de pago ${res.ordenPago.numero} registrada.`);
    setModal(false);
    await onPagoRegistrado?.();
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm p-3 flex justify-between items-center">
          {msg}
          <button type="button" className="text-xs underline" onClick={() => setMsg(null)}>
            Cerrar
          </button>
        </div>
      )}

      {proveedoresConDeuda.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-orange-100 p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Proveedores con deuda pendiente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {proveedoresConDeuda.map((s) => {
              const selected = Number(proveedorId) === Number(s.proveedorId);
              return (
                <button
                  key={s.proveedorId}
                  type="button"
                  onClick={() => setProveedorId(String(s.proveedorId))}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selected
                      ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200'
                      : 'border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  <div className="font-semibold text-gray-800 text-sm truncate">
                    {nombreProv(s.proveedorId)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {s.cantidadFacturas} factura{s.cantidadFacturas !== 1 ? 's' : ''} pendiente
                    {s.cantidadFacturas !== 1 ? 's' : ''}
                  </div>
                  <div className="font-bold text-erp-orange text-sm mt-1">
                    Gs. {s.totalDeuda.toLocaleString('de-DE')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-orange-100 p-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Proveedor</label>
          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="p-2 border rounded-lg min-w-[220px]"
          >
            <option value="">Seleccionar proveedor...</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        {puedeEditar('compras') && (
          <button
            type="button"
            onClick={() => setModal(true)}
            disabled={!facturasPendientes.length}
            className="flex items-center gap-2 bg-erp-orange text-white font-bold px-4 py-2 rounded-lg disabled:opacity-40"
          >
            <Banknote size={18} /> Nueva orden de pago
          </button>
        )}
        {proveedorId && (
          <p className="text-sm text-gray-600">
            Facturas pendientes de <span className="font-semibold">{nombreProv(proveedorId)}</span>:{' '}
            <span className="font-black">{facturasPendientes.length}</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-orange-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold text-gray-800">Órdenes de pago registradas</div>
        <Pagination
          currentPage={curPagePagos}
          totalPages={totPagesPagos}
          onPageChange={setCurPagePagos}
        />
        <table className="w-full text-sm text-left">
          <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Medios</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currentPagos.map((op) => (
              <tr key={op.id}>
                <td className="px-4 py-3 font-mono font-bold">{op.numero}</td>
                <td className="px-4 py-3">{nombreProv(op.proveedorId)}</td>
                <td className="px-4 py-3 text-gray-600">{op.fecha}</td>
                <td className="px-4 py-3 text-xs">
                  {(op.medios ?? []).map((m, i) => (
                    <span key={i} className="inline-block mr-2">
                      {m.medio}: Gs. {Number(m.monto).toLocaleString('de-DE')}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3 text-right font-bold">Gs. {Number(op.total).toLocaleString('de-DE')}</td>
              </tr>
            ))}
            {!currentPagos.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No hay órdenes de pago.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <OrdenPagoProveedoresForm
            proveedorNombre={nombreProv(proveedorId)}
            facturasPendientes={facturasPendientes}
            mediosOpciones={mediosPago}
            cuentas={cuentas}
            onCancelar={() => setModal(false)}
            onGuardar={registrar}
          />
        </div>
      )}
    </div>
  );
};

export default PagosProveedores;
