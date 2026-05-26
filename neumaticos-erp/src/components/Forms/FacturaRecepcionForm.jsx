import { useEffect, useState } from 'react';
import { X, PackageCheck } from 'lucide-react';
import { cantidadPendientePorLinea } from '../../utils/comprasLogic';
import FormattedNumberInput from './FormattedNumberInput';

/**
 * Registro de factura del proveedor contra una OC: número, timbrado, líneas con cantidad y precio.
 * Precio sugerido: el adjudicado en la OC.
 */
const FacturaRecepcionForm = ({ ordenCompra, facturasExistentes = [], onCancelar, onGuardar, errorList = null }) => {
  const [numero, setNumero] = useState('');
  const [timbrado, setTimbrado] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [lineas, setLineas] = useState([]);

  useEffect(() => {
    const pend = cantidadPendientePorLinea(ordenCompra, facturasExistentes);
    setLineas(
      (ordenCompra.lineas ?? []).map((l) => ({
        productoId: l.productoId,
        nombreProducto: l.nombreProducto,
        cantidadPedida: l.cantidadPedida,
        pendiente: pend[l.productoId] ?? 0,
        cantidad: pend[l.productoId] > 0 ? pend[l.productoId] : '',
        precioUnitario: String(l.precioUnitario ?? ''),
      })),
    );
  }, [ordenCompra, facturasExistentes]);

  const setCantidad = (productoId, val) => {
    setLineas((prev) => prev.map((r) => (r.productoId === productoId ? { ...r, cantidad: val } : r)));
  };

  const setPrecio = (productoId, val) => {
    setLineas((prev) => prev.map((r) => (r.productoId === productoId ? { ...r, precioUnitario: val } : r)));
  };

  const handleGuardar = () => {
    const payload = lineas
      .filter((l) => Number(l.cantidad) > 0)
      .map((l) => ({
        productoId: l.productoId,
        nombreProducto: l.nombreProducto,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario) || 0,
      }));
    onGuardar({ numero, timbrado, fecha, lineas: payload });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-100 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="bg-erp-orange p-4 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-white font-bold">Recepción factura — {ordenCompra.numero}</h3>
          <p className="text-white/90 text-xs">Podés facturar menos cantidad que la OC (entrega parcial)</p>
        </div>
        <button type="button" onClick={onCancelar} className="text-white hover:bg-orange-600 rounded-full p-1">
          <X size={22} />
        </button>
      </div>
      <div className="p-4 overflow-y-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600">Número factura</label>
            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="001-001-1234567"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Timbrado</label>
            <input
              value={timbrado}
              onChange={(e) => setTimbrado(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Timbrado SET"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {errorList?.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            <ul className="list-disc pl-5 space-y-1">
              {errorList.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <table className="w-full text-sm border rounded overflow-hidden">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-2 py-2 text-left">Producto</th>
              <th className="px-2 py-2 text-center">Pendiente</th>
              <th className="px-2 py-2 text-center">Cant. factura</th>
              <th className="px-2 py-2 text-right">Precio unit.</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lineas.map((l) => (
              <tr key={l.productoId} className={l.pendiente <= 0 ? 'opacity-50' : ''}>
                <td className="px-2 py-2">{l.nombreProducto}</td>
                <td className="px-2 py-2 text-center font-mono">{l.pendiente}</td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={0}
                    max={l.pendiente}
                    disabled={l.pendiente <= 0}
                    value={l.cantidad}
                    onChange={(e) => setCantidad(l.productoId, e.target.value)}
                    className="w-full p-1 border rounded text-center"
                  />
                </td>
                <td className="px-2 py-2">
                  <FormattedNumberInput
                    value={l.precioUnitario}
                    onChange={(val) => setPrecio(l.productoId, val)}
                    className="w-full p-1 border rounded text-right bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 shrink-0">
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-lg text-gray-600 font-semibold hover:bg-gray-200">
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          className="px-4 py-2 rounded-lg bg-erp-orange text-white font-bold flex items-center gap-2"
        >
          <PackageCheck size={18} /> Validar e ingresar stock
        </button>
      </div>
    </div>
  );
};

export default FacturaRecepcionForm;
