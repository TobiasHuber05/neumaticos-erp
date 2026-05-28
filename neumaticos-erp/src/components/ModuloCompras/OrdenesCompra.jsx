import { useMemo, useState } from 'react';
import { ClipboardCheck, Package, AlertCircle, Eye, X } from 'lucide-react';
import FacturaRecepcionForm from '../Forms/FacturaRecepcionForm';
import NotaDevolucionForm from '../Forms/NotaDevolucionForm';
import NotaCreditoProveedorForm from '../Forms/NotaCreditoProveedorForm';
import { cantidadPendientePorLinea, ordenTienePendienteEntrega } from '../../utils/comprasLogic';
import { puedeEditar } from '../../utils/permisos';
import Pagination, { usePagination } from './Pagination';

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
  // --- ESTADOS PARA LOS MODALES Y ERRORES ---
  const [ocFactura, setOcFactura] = useState(null);
  const [erroresFactura, setErroresFactura] = useState(null);
  const [facturaDevolver, setFacturaDevolver] = useState(null);
  const [ndParaNc, setNdParaNc] = useState(null);
  const [detalleDoc, setDetalleDoc] = useState(null);

  // --- CONFIGURACIÓN DE PAGINACIONES ---

  // 1. Órdenes de compra
  const {
    currentPage: curPageOrdenes,
    totalPages: totPagesOrdenes,
    currentItems: currentOrdenes,
    setCurrentPage: setCurPageOrdenes,
  } = usePagination(ordenesCompra);

  // 2. Facturas aceptadas (Filtradas con useMemo para evitar re-renders innecesarios)
  const facturasAceptadas = useMemo(() => {
    return facturasProveedor.filter((f) => f.estado === 'Aceptada');
  }, [facturasProveedor]);

  const {
    currentPage: curPageFact,
    totalPages: totPagesFact,
    currentItems: currentFacturas,
    setCurrentPage: setCurPageFact,
  } = usePagination(facturasAceptadas);

  // 3. Notas de devolución
  const {
    currentPage: curPageDevol,
    totalPages: totPagesDevol,
    currentItems: currentDevoluciones,
    setCurrentPage: setCurPageDevol,
  } = usePagination(notasDevolucion);

  // 4. Notas de crédito
  const {
    currentPage: curPageCredito,
    totalPages: totPagesCredito,
    currentItems: currentCreditos,
    setCurrentPage: setCurPageCredito,
  } = usePagination(notasCreditoProveedor);


  // --- FUNCIONES AUXILIARES ---
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

  const handleGuardarFactura = async (payload) => {
    setErroresFactura(null);
    const res = await registrarFacturaYStock(ocFactura, payload);
    if (!res.ok) {
      setErroresFactura(res.errores ?? ['No se pudo registrar la factura.']);
      return;
    }
    setOcFactura(null);
  };

  return (
    <div className="space-y-8">

      {/* ========================================================================= */}
      {/* SECCIÓN 1: ÓRDENES DE COMPRA                                              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <ClipboardCheck className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Órdenes de compra</h2>
        </div>

        {/* Paginación Superior */}
        <Pagination
          currentPage={curPageOrdenes}
          totalPages={totPagesOrdenes}
          onPageChange={setCurPageOrdenes}
        />

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
              {currentOrdenes.map((oc) => {
                const estaCerrada = oc.estado === 'Cerrada';
                const pendiente = !estaCerrada && ordenTienePendienteEntrega(oc, facturasProveedor);
                const pendMap = cantidadPendientePorLinea(oc, facturasProveedor);
                const resumen = estaCerrada
                  ? 'Operación cerrada'
                  : (oc.lineas ?? [])
                    .map((l) => `${l.nombreProducto?.slice(0, 12)}…: ${pendMap[l.productoId] ?? 0}`)
                    .join(' · ');
                return (
                  <tr key={oc.id} className="hover:bg-orange-50/40">
                    <td className="px-4 py-3 font-bold">{oc.numero}</td>
                    <td className="px-4 py-3">{nombreProv(oc.proveedorId)}</td>
                    <td className="px-4 py-3 text-gray-600">{oc.fecha}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${oc.estado === 'Cerrada'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                      >
                        {oc.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate" title={resumen}>
                      {estaCerrada ? (
                        <span className="text-green-700 font-bold">Completa</span>
                      ) : pendiente ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                          <AlertCircle size={14} /> Pendiente
                        </span>
                      ) : (
                        <span className="text-green-700 font-bold">Completa</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {puedeEditar('compras') && (
                        <button
                          type="button"
                          disabled={estaCerrada || !pendiente}
                          onClick={() => {
                            setErroresFactura(null);
                            setOcFactura(oc);
                          }}
                          className="text-xs font-bold bg-erp-orange text-white px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Registrar factura
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!currentOrdenes.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">No hay órdenes de compra. Adjudicá un pedido de cotización primero.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Inferior */}
        <Pagination
          currentPage={curPageOrdenes}
          totalPages={totPagesOrdenes}
          onPageChange={setCurPageOrdenes}
          className="border-t border-gray-100"
        />
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: FACTURAS ACEPTADAS Y DEVOLUCIONES                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <Package className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Facturas aceptadas y devoluciones</h2>
        </div>

        {/* Paginación Superior */}
        <Pagination
          currentPage={curPageFact}
          totalPages={totPagesFact}
          onPageChange={setCurPageFact}
          className="mb-2"
        />

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
              {currentFacturas.map((f) => {
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
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${f.estadoPago === 'Pagada'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : f.estadoPago === 'Parcial'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                      >
                        {f.estadoPago}
                      </span>
                      {(f.estadoPago === 'Parcial' || Number(f.totalPagado) > 0) && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          Saldo: Gs. {Number(f.saldoPendiente ?? 0).toLocaleString('de-DE')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {puedeEditar('compras') && (
                        <button
                          type="button"
                          onClick={() => setFacturaDevolver(f)}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Nota devolución
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!currentFacturas.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Aún no hay facturas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Inferior */}
        <Pagination
          currentPage={curPageFact}
          totalPages={totPagesFact}
          onPageChange={setCurPageFact}
          className="mt-2"
        />
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 3: TABLAS DE NOTAS DE DEVOLUCIÓN Y CRÉDITO (DOS COLUMNAS)         */}
      {/* ========================================================================= */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* COLUMNA: NOTAS DE DEVOLUCIÓN */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100 flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Package className="text-erp-orange" />
              <h2 className="text-xl font-bold text-gray-800">Notas de devolución</h2>
            </div>

            {/* Paginación Superior */}
            <Pagination
              currentPage={curPageDevol}
              totalPages={totPagesDevol}
              onPageChange={setCurPageDevol}
              className="border-b border-gray-50"
            />

            <div className="overflow-x-auto p-4">
              <ul className="text-sm space-y-2">
                {currentDevoluciones.map((nd) => (
                  <li key={nd.id} className="flex justify-between gap-2 border-b border-gray-100 pb-2 hover:bg-orange-50/10 px-1 rounded transition-colors">
                    <span className="text-gray-600 truncate font-medium">{nd.motivo || nd.nombreProveedor || `Devolución #${nd.numero || nd.id}`}</span>
                    <div className="flex gap-2 shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => setDetalleDoc({ ...nd, tipo: 'Nota de Devolución' })}
                        className="text-gray-400 hover:text-erp-orange"
                        title="Ver Detalles"
                      >
                        <Eye size={16} />
                      </button>
                      {puedeEditar('compras') && (
                        <button
                          type="button"
                          onClick={() => setNdParaNc(nd)}
                          className="text-erp-orange font-bold text-xs bg-orange-50 px-2 py-0.5 rounded border border-orange-100 hover:bg-orange-100/50"
                        >
                          + NC
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {!currentDevoluciones.length && (
                  <p className="text-sm text-gray-400 py-4 text-center">Sin notas de devolución.</p>
                )}
              </ul>
            </div>
          </div>

          {/* Paginación Inferior */}
          <Pagination
            currentPage={curPageDevol}
            totalPages={totPagesDevol}
            onPageChange={setCurPageDevol}
            className="border-t border-gray-50 bg-gray-50/30"
          />
        </div>

        {/* COLUMNA: NOTAS DE CRÉDITO */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100 flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <ClipboardCheck className="text-erp-orange" />
              <h2 className="text-xl font-bold text-gray-800">Notas de crédito recibidas</h2>
            </div>

            {/* Paginación Superior */}
            <Pagination
              currentPage={curPageCredito}
              totalPages={totPagesCredito}
              onPageChange={setCurPageCredito}
              className="border-b border-gray-50"
            />

            <div className="p-4">
              <ul className="text-sm space-y-2">
                {currentCreditos.map((nc) => (
                  <li key={nc.id} className="flex justify-between items-center border-b border-gray-100 pb-2 hover:bg-orange-50/10 px-1 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-700">{nc.numero}</span>
                      <button
                        type="button"
                        onClick={() => setDetalleDoc({ ...nc, tipo: 'Nota de Crédito' })}
                        className="text-gray-400 hover:text-erp-orange"
                        title="Ver Detalles"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    <span className="font-semibold text-gray-800">Gs. {Number(nc.monto).toLocaleString('de-DE')}</span>
                  </li>
                ))}
                {!currentCreditos.length && (
                  <p className="text-sm text-gray-400 py-4 text-center">Sin notas de crédito.</p>
                )}
              </ul>
            </div>
          </div>

          {/* Paginación Inferior */}
          <Pagination
            currentPage={curPageCredito}
            totalPages={totPagesCredito}
            onPageChange={setCurPageCredito}
            className="border-t border-gray-50 bg-gray-50/30"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 4: CAPA DE MODALES (FORMULARIOS Y DETALLE FLOTANTE)              */}
      {/* ========================================================================= */}

      {/* Modal: Registrar Factura */}
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

      {/* Modal: Nota de Devolución */}
      {facturaDevolver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <NotaDevolucionForm
            factura={facturaDevolver}
            onCancelar={() => setFacturaDevolver(null)}
            onGuardar={async (payload) => {
              const res = await registrarNotaDevolucion(facturaDevolver, payload);
              if (res.ok) setFacturaDevolver(null);
              else alert(res.error || "Error al registrar devolución");
            }}
          />
        </div>
      )}

      {/* Modal: Nota de Crédito */}
      {ndParaNc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <NotaCreditoProveedorForm
            notaDevolucion={ndParaNc}
            onCancelar={() => setNdParaNc(null)}
            onGuardar={async (payload) => {
              const res = await registrarNotaCreditoProveedor(ndParaNc, payload);
              if (res.ok) setNdParaNc(null);
              else alert(res.error || "Error al registrar nota de crédito");
            }}
          />
        </div>
      )}

      {/* Modal: Vista Detallada de Documento */}
      {detalleDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-orange-100">
            <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-erp-orange uppercase text-xs tracking-widest">{detalleDoc.tipo}</h3>
                <p className="text-xl font-bold text-gray-800">{detalleDoc.numero}</p>
              </div>
              <button onClick={() => setDetalleDoc(null)} className="p-2 hover:bg-orange-100 rounded-full transition-colors">
                <X size={20} className="text-erp-orange" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 flex justify-between text-sm">
                <div>
                  <p className="text-gray-400 uppercase text-[10px] font-bold">Proveedor</p>
                  <p className="font-bold text-gray-700">{detalleDoc.nombreProveedor || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 uppercase text-[10px] font-bold">Fecha</p>
                  <p className="font-bold text-gray-700">{detalleDoc.fecha}</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      {detalleDoc.lineas?.[0]?.precioUnitario !== undefined && (
                        <th className="px-3 py-2 text-right">Precio</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detalleDoc.lineas?.map((l, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-bold text-gray-700">{l.nombreProducto}</td>
                        <td className="px-3 py-2 text-center">{l.cantidad}</td>
                        {l.precioUnitario !== undefined && (
                          <td className="px-3 py-2 text-right">Gs. {Number(l.precioUnitario).toLocaleString('de-DE')}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(detalleDoc.total > 0 || detalleDoc.monto > 0) && (
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-gray-500 font-bold uppercase text-xs">Total</span>
                  <span className="text-xl font-black text-erp-orange">
                    Gs. {Number(detalleDoc.total || detalleDoc.monto).toLocaleString('de-DE')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesCompra;