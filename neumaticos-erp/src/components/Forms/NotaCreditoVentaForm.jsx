import { useState } from 'react';
import { RotateCcw, X, AlertTriangle, CheckCircle } from 'lucide-react';
import * as ventasLogic from '../../utils/ventasLogic.js';

/**
 * Nota crédito devolución producto <48h desde factura.
 * Props: factura, inventario, setInventario, ventas (hook), onCancelar
 * Motivo dropdown, líneas qty devolver (≤ facturada), call hook.solicitarNotaCredito
 */
const NotaCreditoVentaForm = ({ factura, inventario, setInventario, ventas, onCancelar }) => {
  const [motivo, setMotivo] = useState('Defecto de fabricación');
  const [lineasDevueltas, setLineasDevueltas] = useState(
    factura.lineas.map(l => ({ ...l, cantidadDevolver: 0 }))
  );
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const MOTIVOS = [
    'Defecto de fabricación',
    'Producto equivocado',
    'Cliente cambió opinión',
    'Daño en transporte',
    'Otros',
  ];

  const totalDevolver = lineasDevueltas.reduce((sum, l) => sum + (l.cantidadDevolver * l.precioUnitario), 0);
  const dentro48h = ventasLogic.validarDevolucion(factura);

  const handleCantidadChange = (index, qty) => {
    const newLineas = [...lineasDevueltas];
    newLineas[index].cantidadDevolver = Math.min(Math.max(0, qty), newLineas[index].cantidad);
    setLineasDevueltas(newLineas);
  };

  const handleConfirmar = async () => {
    const lineasValidas = lineasDevueltas.filter(l => l.cantidadDevolver > 0);
    if (lineasValidas.length === 0) {
      setError('Seleccione al menos 1 unidad a devolver');
      return;
    }
    if (!dentro48h) {
      setError('Fuera de plazo 48 horas');
      return;
    }

    setProcesando(true);
    setError('');
    try {
      await ventas.actions.solicitarNotaCredito(factura.id, lineasValidas, motivo, inventario, setInventario);
      onCancelar();
    } catch (err) {
      setError(err.message);
    }
    setProcesando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-3 rounded-xl">
              <RotateCcw className="text-red-500 w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800">Nota de Crédito</h3>
              <p className="text-sm text-gray-500">Devolución Factura {factura.numero}</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all" disabled={procesando}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-red-500 w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 font-bold">{error}</p>
          </div>
        )}

        {!dentro48h && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 w-6 h-6 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-800">Fuera de plazo devolución</p>
                <p className="text-sm text-red-700">Límite 48hs desde {factura.fecha48h}</p>
              </div>
            </div>
          </div>
        )}

        {/* Motivo */}
        <div className="mb-8 p-6 bg-gray-50 rounded-xl">
          <label className="block text-sm font-bold text-gray-600 mb-3 uppercase">Motivo devolución</label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full py-4 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 font-medium text-sm"
            disabled={!dentro48h}
          >
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Tabla devoluciones */}
        <div className="mb-8">
          <h4 className="font-bold text-lg text-gray-800 mb-4">Líneas a devolver</h4>
          <div className="overflow-x-auto bg-gray-50 rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-gray-700">Producto</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700">Facturado</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700">Devolver</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-700">Precio</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-700">Total Dev.</th>
                </tr>
              </thead>
              <tbody>
                {lineasDevueltas.map((linea, index) => (
                  <tr key={index} className="border-t hover:bg-red-50">
                    <td className="px-6 py-4 font-medium">
                      {inventario.find(p => p.id === linea.productoId)?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-gray-900">{linea.cantidad}</td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max={linea.cantidad}
                        value={linea.cantidadDevolver}
                        onChange={(e) => handleCantidadChange(index, parseInt(e.target.value))}
                        className="w-20 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-400 text-center font-mono"
                        disabled={!dentro48h}
                      />
                    </td>
                    <td className="px-6 py-4 text-right font-mono">Gs. {linea.precioUnitario.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      Gs. {(linea.cantidadDevolver * linea.precioUnitario).toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-red-500/10 border-t-2 border-red-500">
                  <td colSpan="4" className="px-6 py-6 text-right font-black uppercase text-lg">TOTAL NOTA CRÉDITO</td>
                  <td className="px-6 py-6 text-right text-3xl font-black text-red-600">
                    Gs. {totalDevolver.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota stock */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Se repone stock automáticamente. Se genera asiento de devolución.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-xl transition-all uppercase text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!dentro48h || procesando || totalDevolver === 0}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all uppercase text-sm flex items-center justify-center gap-2"
          >
            {procesando ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <RotateCcw size={20} />
                Generar Nota Crédito
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotaCreditoVentaForm;

