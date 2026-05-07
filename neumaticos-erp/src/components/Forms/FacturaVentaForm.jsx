import { useState } from 'react';
import { FileText, X, PackageCheck, AlertCircle, CheckCircle, User } from 'lucide-react';
import * as ventasLogic from '../../utils/ventasLogic.js';

/**
 * Form confirmación factura desde presupuesto vigente.
 * Props: presupuesto, clientes[], inventario, setInventario (from compras), ventas (hook), onCancelar
 * Llama ventas.generarFactura → stock update + asiento
 */
const FacturaVentaForm = ({ presupuesto, clientes, inventario, servicios = [], setInventario, ventas, onCancelar }) => {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [nroFactura, setNroFactura] = useState('');
  const [timbrado, setTimbrado] = useState(''); // Default or empty
  const [tipoPago, setTipoPago] = useState('Contado');

  const cliente = clientes.find(c => c.id === presupuesto.clientId);
  const vigente = ventas ? ventas.presupuestos?.some(p => p.id === presupuesto.id && ventasLogic.isBudgetVigente(p)) : true;

  const handleConfirmar = async () => {
    if (!vigente) {
      setError('Presupuesto expirado');
      return;
    }
    setProcesando(true);
    setError('');
    try {
      const datosFactura = {
        nro_factura: nroFactura,
        timbrado: timbrado,
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
      <div className="p-6 lg:p-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-3 rounded-xl">
              <PackageCheck className="text-green-500 w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800">Confirmar Factura</h3>
              <p className="text-sm text-gray-500">Presupuesto {presupuesto.numero}</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all" disabled={procesando}>
            <X size={20} />
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

        {/* Resumen cliente y Datos Factura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Cliente
            </h4>
            {cliente ? (
              <div className="space-y-1">
                <p className="font-bold text-gray-900">{cliente.nombre} {cliente.apellido}</p>
                <p className="text-sm text-gray-600">{cliente.documento}</p>
                <p className="text-sm text-gray-500">{cliente.correo}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Cargando cliente...</p>
            )}
          </div>

          <div className="p-6 bg-orange-50/50 border border-orange-100 rounded-xl space-y-4">
            <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-erp-orange" />
              Datos de Factura
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Nro. Factura</label>
                <input
                  value={nroFactura}
                  onChange={(e) => setNroFactura(e.target.value)}
                  placeholder="001-001-0000001"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-erp-orange"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Timbrado</label>
                <input 
                  value={timbrado}
                  onChange={(e) => setTimbrado(e.target.value)}
                  placeholder="12345678"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-erp-orange"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Tipo de Pago</label>
              <select
                value={tipoPago}
                onChange={(e) => setTipoPago(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-erp-orange bg-white"
              >
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla líneas */}
        <div className="mb-8">
          <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            Artículos a facturar ({presupuesto.lineas.length})
          </h4>
          <div className="overflow-x-auto bg-gray-50 rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-gray-700">Producto</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700">Cantidad</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-700">Precio Unit.</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {presupuesto.lineas.map((linea, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {(inventario.find(p => p.id_producto_servicio === linea.productoId) || 
                        servicios.find(s => s.id_producto_servicio === linea.productoId) ||
                        inventario.find(p => p.id === linea.productoId))?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center font-mono">{linea.cantidad}</td>
                    <td className="px-6 py-4 text-right font-mono">Gs. {linea.precioUnitario.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-erp-orange text-lg">
                      Gs. {linea.totalLinea.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-erp-orange/20 border-t-2 border-erp-orange">
                  <td colSpan="3" className="px-6 py-6 text-right font-black uppercase text-lg">TOTAL FACTURA</td>
                  <td className="px-6 py-6 text-right text-3xl font-black text-erp-orange">
                    Gs. {presupuesto.total.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota stock */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <CheckCircle className="inline w-5 h-5 mr-2" />
            Se descontará automáticamente del stock. Se generará asiento contable.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-xl transition-all uppercase text-sm tracking-wide"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!vigente || procesando || !nroFactura}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all uppercase text-sm tracking-wide flex items-center justify-center gap-2"
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
