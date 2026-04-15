import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';

/**
 * Carga de precios unitarios por ítem para una cotización de un proveedor.
 * `lineas` iniciales: { productoId, nombreProducto, cantidadSolicitada, precioUnitario }
 */
const CotizacionProveedorForm = ({ proveedorNombre, cotizacion, onCancelar, onGuardar }) => {
  const [lineas, setLineas] = useState([]);
  const [fechaRespuesta, setFechaRespuesta] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLineas(
      (cotizacion.lineas ?? []).map((l) => ({
        ...l,
        precioUnitario: l.precioUnitario === '' || l.precioUnitario == null ? '' : String(l.precioUnitario),
      })),
    );
  }, [cotizacion]);

  const updatePrecio = (productoId, val) => {
    setLineas((prev) => prev.map((l) => (l.productoId === productoId ? { ...l, precioUnitario: val } : l)));
  };

  const handleGuardar = () => {
    const parsed = lineas.map((l) => ({
      ...l,
      precioUnitario: l.precioUnitario === '' ? '' : Number(l.precioUnitario),
    }));
    onGuardar(parsed, fechaRespuesta);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-100 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="bg-erp-orange p-4 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-white font-bold">Cotización — {proveedorNombre}</h3>
          <p className="text-white/90 text-xs">Ingresá precio unitario por producto solicitado</p>
        </div>
        <button type="button" onClick={onCancelar} className="text-white hover:bg-orange-600 rounded-full p-1">
          <X size={22} />
        </button>
      </div>
      <div className="p-4 overflow-y-auto">
        <label className="block text-xs font-bold text-gray-600 mb-1">Fecha respuesta</label>
        <input
          type="date"
          value={fechaRespuesta}
          onChange={(e) => setFechaRespuesta(e.target.value)}
          className="mb-4 p-2 border rounded w-full max-w-xs"
        />
        <table className="w-full text-sm border rounded overflow-hidden">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-center">Cant. solicitada</th>
              <th className="px-3 py-2 text-right">Precio unit. (Gs.)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lineas.map((l) => (
              <tr key={l.productoId}>
                <td className="px-3 py-2 font-medium">{l.nombreProducto}</td>
                <td className="px-3 py-2 text-center">{l.cantidadSolicitada}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={l.precioUnitario}
                    onChange={(e) => updatePrecio(l.productoId, e.target.value)}
                    className="w-full p-1.5 border rounded text-right"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 shrink-0">
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-lg text-gray-600 font-semibold hover:bg-gray-200">
          Cerrar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          className="px-4 py-2 rounded-lg bg-erp-orange text-white font-bold flex items-center gap-2"
        >
          <Save size={18} /> Guardar cotización
        </button>
      </div>
    </div>
  );
};

export default CotizacionProveedorForm;
