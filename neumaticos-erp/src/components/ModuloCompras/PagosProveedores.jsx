import { useState } from 'react';
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
  const [proveedorId, setProveedorId] = useState(proveedores[0]?.id ?? '');
  const [modal, setModal] = useState(false);

  const { currentPage: curPagePagos, totalPages: totPagesPagos, currentItems: currentPagos, setCurrentPage: setCurPagePagos } = usePagination(ordenesPagoProveedores);
  const [msg, setMsg] = useState(null);

  const nombreProv = (id) => proveedores.find((p) => p.id === id)?.nombre ?? '';

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

      <div className="bg-white rounded-xl shadow-md border border-orange-100 p-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Proveedor</label>
          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="p-2 border rounded-lg min-w-[220px]"
          >
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
        <p className="text-sm text-gray-600">
          Facturas pendientes de pago: <span className="font-black">{facturasPendientes.length}</span>
        </p>
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
