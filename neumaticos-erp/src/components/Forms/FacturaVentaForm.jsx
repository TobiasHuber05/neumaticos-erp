import { useState, useEffect } from 'react';
import { FileText, X, PackageCheck, AlertCircle, CheckCircle, User, Loader } from 'lucide-react';
import * as ventasLogic from '../../utils/ventasLogic.js';

/**
 * Form confirmación factura desde presupuesto vigente.
 * Props: presupuesto, clientes[], inventario, setInventario (from compras), ventas (hook), onCancelar
 * Llama ventas.generarFactura → stock update + asiento
 */
const FacturaVentaForm = ({ presupuesto, clientes, inventario, servicios = [], setInventario, ventas, onCancelar }) => {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [cargandoTimbrados, setCargandoTimbrados] = useState(true);
  const [timbrados, setTimbrados] = useState([]);
  const [idPuntoExpedicion, setIdPuntoExpedicion] = useState(''); // ID del punto de expedición seleccionado
  const [tipoPago, setTipoPago] = useState('Contado');

  const cliente = clientes.find(c => c.id === presupuesto.clientId);
  const vigente = ventas ? ventas.presupuestos?.some(p => p.id === presupuesto.id && ventasLogic.isBudgetVigente(p)) : true;

  // Cargar timbrados y puntos de expedición activos
  useEffect(() => {
    const cargarTimbrados = async () => {
      try {
        const response = await fetch('/api/timbrados', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Error al cargar timbrados');
        const data = await response.json();
        setTimbrados(data);
        
        // Extraer todos los puntos de expedición válidos
        const puntosValidos = [];
        data.forEach(t => {
          const vencido = new Date() > new Date(t.fecha_fin);
          if (t.estado && !vencido && t.puntos_expedicion) {
            t.puntos_expedicion.forEach(p => {
              if (p.activo) {
                puntosValidos.push({ ...p, timbrado: t });
              }
            });
          }
        });

        // Seleccionar automáticamente el primero disponible
        if (puntosValidos.length > 0) {
          setIdPuntoExpedicion(puntosValidos[0].id);
        } else {
          setError('No hay puntos de expedición activos con timbrados vigentes. Cree uno primero.');
        }
      } catch (err) {
        setError(`Error al cargar timbrados: ${err.message}`);
      } finally {
        setCargandoTimbrados(false);
      }
    };
    
    cargarTimbrados();
  }, []);

  const obtenerPuntosValidos = () => {
    const list = [];
    timbrados.forEach(t => {
      const vencido = new Date() > new Date(t.fecha_fin);
      if (t.estado && !vencido && t.puntos_expedicion) {
        t.puntos_expedicion.forEach(p => {
          if (p.activo) {
            list.push({ ...p, timbrado: t });
          }
        });
      }
    });
    return list;
  };

  const puntosExpedicionValidos = obtenerPuntosValidos();
  const puntoSeleccionado = puntosExpedicionValidos.find(p => p.id == idPuntoExpedicion);

  const nroFacturaAutomatico = puntoSeleccionado 
    ? `${puntoSeleccionado.cod_establecimiento.padStart(3, '0')}-${puntoSeleccionado.cod_punto_expedicion.padStart(3, '0')}-${String(puntoSeleccionado.ultimo_secuencial + 1).padStart(7, '0')}`
    : '';

  const handleConfirmar = async () => {
    if (!vigente) {
      setError('Presupuesto expirado');
      return;
    }

    if (!idPuntoExpedicion) {
      setError('Debe seleccionar un punto de expedición válido');
      return;
    }

    setProcesando(true);
    setError('');
    try {
      const datosFactura = {
        idPuntoExpedicion: parseInt(idPuntoExpedicion),
        contado_credito: tipoPago
      };
      await ventas.actions.generarFactura(presupuesto.id, datosFactura, inventario, setInventario);
      onCancelar(); // Close after success
    } catch (err) {
      setError(err.message);
    }
    setProcesando(false);
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="p-4 lg:p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-xl">
              <PackageCheck className="text-green-500 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800">Confirmar Factura</h3>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Presupuesto {presupuesto.numero}</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all" disabled={procesando}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 font-bold">{error}</p>
          </div>
        )}

        {!vigente && (
          <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 w-6 h-6 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-yellow-800">Presupuesto expirado</p>
                <p className="text-sm text-yellow-700">Expiró el {presupuesto.fechaExpiracion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resumen cliente y Datos Factura - Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          {/* Columna Cliente */}
          <div className="md:col-span-4 p-3 rounded-xl border border-gray-100 bg-gray-50/30">
            <h4 className="font-bold text-[10px] text-gray-500 mb-1 flex items-center gap-2 uppercase tracking-wider">
              <User className="w-3 h-3" />
              Cliente
            </h4>
            {cliente ? (
              <div className="space-y-0.5">
                <p className="font-bold text-gray-900 text-sm leading-tight">{cliente.nombre} {cliente.apellido}</p>
                <p className="text-[10px] text-gray-600">{cliente.documento}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-xs">Cargando cliente...</p>
            )}
          </div>

          {/* Columna Datos Factura */}
          <div className="md:col-span-8 p-3 border border-orange-100 rounded-xl bg-orange-50/10">
            {cargandoTimbrados ? (
              <div className="flex items-center justify-center gap-2 h-12">
                <Loader className="w-4 h-4 text-erp-orange animate-spin" />
                <span className="text-xs text-gray-600 font-medium">Cargando timbrados...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 block mb-0.5">Nro. Factura (Automático)</label>
                  <div className="w-full px-2 py-1.5 border rounded-lg text-xs bg-gray-50 font-mono font-bold text-erp-orange border-gray-300">
                    {nroFacturaAutomatico || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 block mb-0.5">Punto Expedición / Timbrado *</label>
                  <select
                    value={idPuntoExpedicion}
                    onChange={(e) => setIdPuntoExpedicion(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-erp-orange bg-white font-bold"
                  >
                    <option value="">Seleccionar punto...</option>
                    {puntosExpedicionValidos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.cod_establecimiento}-{p.cod_punto_expedicion} (Timbrado: {p.timbrado.nro_timbrado})
                      </option>
                    ))}
                  </select>
                  {puntoSeleccionado && (
                    <p className="text-[8px] text-gray-600 mt-0.5">
                      Rango: {puntoSeleccionado.timbrado.rango_desde}-{puntoSeleccionado.timbrado.rango_hasta} | Siguiente: {puntoSeleccionado.ultimo_secuencial + 1}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 block mb-0.5">Tipo de Pago</label>
                  <select
                    value={tipoPago}
                    onChange={(e) => setTipoPago(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-erp-orange bg-white font-bold"
                  >
                    <option value="Contado">Contado</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla líneas */}
        <div className="mb-6">
          <h4 className="font-bold text-xs text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wider">
            Artículos a facturar ({presupuesto.lineas.length})
          </h4>
          <div className="overflow-x-auto bg-gray-50 rounded-xl border">
            <table className="w-full text-xs">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-2 text-left font-bold text-gray-700">Producto</th>
                  <th className="px-4 py-2 text-center font-bold text-gray-700">Cantidad</th>
                  <th className="px-4 py-2 text-right font-bold text-gray-700">Precio Unit.</th>
                  <th className="px-4 py-2 text-right font-bold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {presupuesto.lineas.map((linea, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-1.5 font-medium text-gray-900">
                      {(inventario.find(p => p.id_producto_servicio === linea.productoId) ||
                        servicios.find(s => s.id_producto_servicio === linea.productoId) ||
                        inventario.find(p => p.id === linea.productoId))?.nombre || 'N/A'}
                    </td>
                    <td className="px-3 py-1.5 text-center">{linea.cantidad}</td>
                    <td className="px-3 py-1.5 text-right">Gs. {linea.precioUnitario.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right text-sm">
                      Gs. {linea.totalLinea.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-erp-orange/5 border-t-2 border-erp-orange">
                  <td colSpan="3" className="px-3 py-2 text-right font-black uppercase text-[10px]">TOTAL FACTURA</td>
                  <td className="px-3 py-2 text-right text-xl font-black text-erp-orange">
                    Gs. {presupuesto.total.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota stock */}
        <div className="mb-4 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center gap-2">
          <CheckCircle className="text-blue-600 w-4 h-4 flex-shrink-0" />
          <p className="text-[10px] text-blue-800 font-medium">
            Se descontará automáticamente del stock y se generará el asiento contable correspondiente.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-all uppercase text-xs tracking-wide"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!vigente || procesando || !idPuntoExpedicion || cargandoTimbrados}
            className="flex-1 bg-green-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl shadow-lg hover:shadow-xl transition-all uppercase text-xs tracking-wide flex items-center justify-center gap-2"
          >
            {procesando ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <PackageCheck size={20} />
                Confirmar y Facturar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacturaVentaForm;
