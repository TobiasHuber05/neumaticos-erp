import { useState } from 'react';
import { Send, Users, Gavel, AlertTriangle, Pencil, Eye, X } from 'lucide-react';
import CotizacionProveedorForm from '../Forms/CotizacionProveedorForm';
import { ESTADOS_PEDIDO_COMPRA } from '../Forms/comprasFormDefaults';

const Cotizaciones = ({
  pedidos = [],
  proveedores = [],
  pedidosCotizacion = [],
  cotizacionesProveedor = [],
  generarPedidoCotizacion,
  actualizarCotizacionProveedor,
  adjudicarYGenerarOrdenes,
}) => {
  const [mensaje, setMensaje] = useState(null);
  const [cotEdit, setCotEdit] = useState(null);
  const [loadingGenerar, setLoadingGenerar] = useState(null); // id del pedido en proceso
  const [loadingAdjudicar, setLoadingAdjudicar] = useState(null);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);

  const nombreProv = (id) => proveedores.find((p) => p.id === id)?.nombre ?? `Proveedor ${id}`;

  const pedidosPendientesCot = pedidos.filter(
    (p) => p.estado === ESTADOS_PEDIDO_COMPRA.PENDIENTE_COTIZACION,
  );

  const onGenerar = async (pedido) => {
    setLoadingGenerar(pedido.id);
    const res = await generarPedidoCotizacion(pedido);
    setLoadingGenerar(null);
    if (!res.ok) {
      setMensaje({ tipo: 'err', text: res.error });
    } else {
      setMensaje({
        tipo: res.advertencia ? 'warn' : 'ok',
        text:
          res.advertencia ||
          `Pedido de cotización generado y enviado a ${res.pedidoCot.proveedorIds.length} proveedor(es).`,
      });
    }
  };

  const onAdjudicar = async (pc) => {
    setLoadingAdjudicar(pc.id);
    const res = await adjudicarYGenerarOrdenes(pc);
    setLoadingAdjudicar(null);
    if (!res.ok) {
      setMensaje({ tipo: 'err', text: res.error });
    } else {
      setMensaje({
        tipo: 'ok',
        text: `Se adjudicó al proveedor con menor precio por ítem. Se generaron ${res.ordenes.length} orden(es) de compra.`,
      });
    }
  };

  const onGuardarPrecios = async (lineas, fechaRespuesta) => {
    await actualizarCotizacionProveedor(cotEdit.id, lineas, fechaRespuesta);
    setCotEdit(null);
  };

  const cotizacionesDe = (pcId) =>
    cotizacionesProveedor.filter((c) => c.pedidoCotizacionId === pcId);

  return (
    <div className="space-y-8">
      {/* Mensaje de feedback */}
      {mensaje && (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            mensaje.tipo === 'err'
              ? 'bg-red-50 border-red-200 text-red-800'
              : mensaje.tipo === 'warn'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {mensaje.tipo === 'warn' && (
            <AlertTriangle className="inline mr-2 mb-0.5" size={16} />
          )}
          {mensaje.text}
          <button
            type="button"
            className="float-right text-xs underline"
            onClick={() => setMensaje(null)}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tabla: Pedidos pendientes de cotización */}
      <div className="bg-white rounded-xl shadow-md border border-orange-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex items-center gap-2">
          <Send className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">
            Pedidos de compra → Pedido de cotización
          </h2>
        </div>
        <p className="px-6 pt-4 text-sm text-gray-600">
          Se invitan automáticamente a los proveedores que cubren las categorías de los productos
          (objetivo: al menos tres proveedores).
        </p>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
              <tr>
                <th className="px-4 py-2">Pedido</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Ítems</th>
                <th className="px-4 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pedidosPendientesCot.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-bold">{p.numero}</td>
                  <td className="px-4 py-3 text-gray-600">{p.fecha}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setPedidoDetalle(p)}
                      className="flex items-center gap-1.5 text-erp-orange hover:bg-orange-50 px-2 py-1 rounded-md transition-colors font-bold"
                      title="Ver detalles del pedido"
                    >
                      <Eye size={16} />
                      <span className="text-xs">{p.items?.length ?? p.productos}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onGenerar(p)}
                      disabled={loadingGenerar === p.id}
                      className="text-xs font-bold bg-erp-orange text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {loadingGenerar === p.id ? 'Generando...' : 'Generar pedido de cotización'}
                    </button>
                  </td>
                </tr>
              ))}
              {!pedidosPendientesCot.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No hay pedidos pendientes de cotización.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cotizaciones por proveedor */}
      <div className="bg-white rounded-xl shadow-md border border-orange-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex items-center gap-2">
          <Users className="text-erp-orange" />
          <h2 className="text-xl font-bold text-gray-800">Cotizaciones por proveedor</h2>
        </div>
        <div className="divide-y max-h-[480px] overflow-y-auto">
          {pedidosCotizacion.map((pc) => (
            <div key={pc.id} className="p-4 hover:bg-orange-50/30">
              <div className="flex flex-wrap justify-between gap-2 items-start mb-3">
                <div>
                  <p className="font-black text-erp-orange">
                    PED-{String(pc.id).padStart(4, '0')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Enviado {pc.fechaEnvio ?? '—'}
                  </p>
                  {pc.advertencia && (
                    <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} /> {pc.advertencia}
                    </p>
                  )}
                </div>
                {pc.estado !== 'Adjudicado' ? (
                  <button
                    type="button"
                    onClick={() => onAdjudicar(pc)}
                    disabled={loadingAdjudicar === pc.id}
                    className="flex items-center gap-1 text-xs font-black uppercase bg-gray-900 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    <Gavel size={14} />
                    {loadingAdjudicar === pc.id ? 'Adjudicando...' : 'Adjudicar menor precio y generar OC'}
                  </button>
                ) : (
                  <span className="text-xs font-black uppercase text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200">
                    Adjudicado
                  </span>
                )}
              </div>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {cotizacionesDe(pc.id).map((c) => (
                  <li
                    key={c.id}
                    className="border border-orange-100 rounded-lg p-3 flex flex-col justify-between bg-white shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-sm">{nombreProv(c.proveedorId)}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{c.estado}</p>
                      {c.fechaRespuesta && (
                        <p className="text-xs text-gray-400">Resp. {c.fechaRespuesta}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCotEdit(c)}
                      className="mt-2 text-xs font-bold text-erp-orange flex items-center gap-1"
                    >
                      <Pencil size={12} /> Cargar / editar precios
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!pedidosCotizacion.length && (
            <p className="p-8 text-center text-gray-400 text-sm">
              Todavía no hay pedidos de cotización generados.
            </p>
          )}
        </div>
      </div>

      {/* Modal cargar precios */}
      {cotEdit && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-10 overflow-y-auto">
          <CotizacionProveedorForm
            proveedorNombre={nombreProv(cotEdit.proveedorId)}
            cotizacion={cotEdit}
            onCancelar={() => setCotEdit(null)}
            onGuardar={onGuardarPrecios}
          />
        </div>
      )}

      {/* Modal de Detalle de Pedido (Igual que en PedidosCompra) */}
      {pedidoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-orange-100 max-w-2xl w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-erp-orange p-4 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Eye size={20} />
                Detalle del Pedido: {pedidoDetalle.numero}
              </h3>
              <button
                type="button"
                onClick={() => setPedidoDetalle(null)}
                className="text-white hover:bg-orange-600 rounded-full p-1 transition-colors"
                title="Cerrar detalle"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {!pedidoDetalle.items || pedidoDetalle.items.length === 0 ? (
                <p className="text-sm text-gray-500">Este pedido no tiene ítems cargados.</p>
              ) : (
                <div className="border border-orange-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
                      <tr>
                        <th className="px-4 py-2">Producto</th>
                        <th className="px-4 py-2">Categoría</th>
                        <th className="px-4 py-2 text-center">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {pedidoDetalle.items.map((item) => (
                        <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{item.nombreProducto}</td>
                          <td className="px-4 py-3 text-gray-600">{item.categoria}</td>
                          <td className="px-4 py-3 text-center font-bold text-erp-orange">{item.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;