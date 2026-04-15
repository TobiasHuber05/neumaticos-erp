import { useMemo, useState } from 'react';
import { X, Banknote } from 'lucide-react';

/**
 * Orden de pago: un proveedor, varias facturas pendientes, uno o más medios de pago.
 * `mediosOpciones` desde ERP (ej. MEDIOS_PAGO_PROVEEDOR).
 */
const OrdenPagoProveedoresForm = ({ proveedorNombre, facturasPendientes = [], mediosOpciones = [], onCancelar, onGuardar }) => {
  const [seleccion, setSeleccion] = useState({});
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [medios, setMedios] = useState([{ medio: mediosOpciones[0] ?? 'Efectivo', monto: '' }]);

  const toggleFac = (id) => {
    setSeleccion((s) => ({ ...s, [id]: !s[id] }));
  };

  const totalFacturas = useMemo(() => {
    return facturasPendientes.filter((f) => seleccion[f.id]).reduce((a, f) => a + (Number(f.total) || 0), 0);
  }, [facturasPendientes, seleccion]);

  const addMedio = () => {
    setMedios((m) => [...m, { medio: mediosOpciones[0] ?? 'Efectivo', monto: '' }]);
  };

  const updateMedio = (idx, field, val) => {
    setMedios((m) => m.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
  };

  const removeMedio = (idx) => {
    setMedios((m) => (m.length <= 1 ? m : m.filter((_, i) => i !== idx)));
  };

  const handleGuardar = () => {
    const facturaIds = facturasPendientes.filter((f) => seleccion[f.id]).map((f) => f.id);
    const mediosPayload = medios
      .map((m) => ({ medio: m.medio, monto: Number(m.monto) || 0 }))
      .filter((m) => m.monto > 0);
    onGuardar({
    fecha,
    facturaIds: Object.keys(seleccion).filter(id => seleccion[id]).map(Number),
    medios,
    total: totalFacturas
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-100 max-w-lg w-full">
      <div className="bg-erp-orange p-4 flex justify-between items-center rounded-t-xl">
        <div>
          <h3 className="text-white font-bold">Orden de pago</h3>
          <p className="text-white/90 text-xs">{proveedorNombre}</p>
        </div>
        <button type="button" onClick={onCancelar} className="text-white hover:bg-orange-600 rounded-full p-1">
          <X size={22} />
        </button>
      </div>
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        <div>
          <label className="text-xs font-bold text-gray-600">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full p-2 border rounded mt-1" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">Facturas pendientes de pago</p>
          <ul className="space-y-2">
            {facturasPendientes.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!seleccion[f.id]} onChange={() => toggleFac(f.id)} />
                <span className="flex-1 font-medium">
                  {f.numero} — Gs. {Number(f.total).toLocaleString('de-DE')}
                </span>
              </li>
            ))}
            {!facturasPendientes.length && <li className="text-gray-500 text-sm">No hay facturas pendientes.</li>}
          </ul>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-gray-600">Medios de pago</p>
            <button type="button" onClick={addMedio} className="text-xs font-bold text-erp-orange hover:underline">
              + Medio
            </button>
          </div>
          {medios.map((row, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <select
                value={row.medio}
                onChange={(e) => updateMedio(idx, 'medio', e.target.value)}
                className="flex-1 p-2 border rounded text-sm"
              >
                {mediosOpciones.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                placeholder="Monto"
                value={row.monto}
                onChange={(e) => updateMedio(idx, 'monto', e.target.value)}
                className="w-28 p-2 border rounded text-sm text-right"
              />
              <button type="button" onClick={() => removeMedio(idx)} className="text-red-500 text-xs px-2">
                ✕
              </button>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-700">
          Total seleccionado facturas: <span className="font-black">Gs. {totalFacturas.toLocaleString('de-DE')}</span>
        </p>
      </div>
      <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-xl">
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-lg text-gray-600 font-semibold hover:bg-gray-200">
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          className="px-4 py-2 rounded-lg bg-erp-orange text-white font-bold flex items-center gap-2"
        >
          <Banknote size={18} /> Registrar orden de pago
        </button>
      </div>
    </div>
  );
};

export default OrdenPagoProveedoresForm;
