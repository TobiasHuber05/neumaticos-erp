import { useEffect, useState } from 'react';
import { X, Undo2 } from 'lucide-react';
import { MOTIVOS_DEVOLUCION } from './comprasFormDefaults';

/**
 * Nota de devolución al proveedor por ítems recibidos en una factura aceptada.
 */
const NotaDevolucionForm = ({ factura, onCancelar, onGuardar }) => {
  const [motivo, setMotivo] = useState(MOTIVOS_DEVOLUCION[0]);
  const [motivoOtro, setMotivoOtro] = useState('');
  const [lineas, setLineas] = useState([]);

  useEffect(() => {
    setLineas(
      (factura.lineas ?? []).map((l) => ({
        productoId: l.productoId,
        nombreProducto: l.nombreProducto,
        max: Number(l.cantidad) || 0,
        cantidad: '',
        precioUnitario: Number(l.precioUnitario) || 0,
      })),
    );
  }, [factura]);

  const setCantidad = (productoId, val) => {
    setLineas((prev) => prev.map((r) => (r.productoId === productoId ? { ...r, cantidad: val } : r)));
  };

  const handleGuardar = () => {
    const motivoFinal = motivo === 'Otro' ? motivoOtro.trim() : motivo;
    if (!motivoFinal) return;
    const payload = lineas
      .filter((l) => Number(l.cantidad) > 0)
      .map((l) => ({
        productoId: l.productoId,
        nombreProducto: l.nombreProducto,
        cantidad: Math.min(Number(l.cantidad), l.max),
        precioUnitario: l.precioUnitario,
      }));
    if (!payload.length) return;
    onGuardar({ motivo: motivoFinal, lineas: payload });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-red-100 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="bg-red-600 p-4 flex justify-between items-center shrink-0">
        <h3 className="text-white font-bold">Nota de devolución — Factura {factura.numero}</h3>
        <button type="button" onClick={onCancelar} className="text-white hover:bg-red-700 rounded-full p-1">
          <X size={22} />
        </button>
      </div>
      <div className="p-4 overflow-y-auto space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-600">Motivo</label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full p-2 border rounded mt-1"
          >
            {MOTIVOS_DEVOLUCION.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {motivo === 'Otro' && (
            <textarea
              value={motivoOtro}
              onChange={(e) => setMotivoOtro(e.target.value)}
              className="w-full mt-2 p-2 border rounded text-sm"
              rows={2}
              placeholder="Detalle del motivo"
            />
          )}
        </div>
        <table className="w-full text-sm border rounded overflow-hidden">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-2 py-2 text-left">Producto</th>
              <th className="px-2 py-2 text-center">En factura</th>
              <th className="px-2 py-2 text-center">A devolver</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lineas.map((l) => (
              <tr key={l.productoId}>
                <td className="px-2 py-2">{l.nombreProducto}</td>
                <td className="px-2 py-2 text-center">{l.max}</td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={0}
                    max={l.max}
                    value={l.cantidad}
                    onChange={(e) => setCantidad(l.productoId, e.target.value)}
                    className="w-full p-1 border rounded text-center"
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
          className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold flex items-center gap-2"
        >
          <Undo2 size={18} /> Registrar devolución
        </button>
      </div>
    </div>
  );
};

export default NotaDevolucionForm;
