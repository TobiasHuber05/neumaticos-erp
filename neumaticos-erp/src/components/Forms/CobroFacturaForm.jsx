import { useState } from 'react';
import { X, Banknote } from 'lucide-react';
import FormattedNumberInput from './FormattedNumberInput';

const MEDIOS_CON_CUENTA = ['Cheque', 'Transferencia bancaria', 'Efectivo'];

const CobroFacturaForm = ({
  factura,
  clienteNombre,
  mediosOpciones = [],
  cuentas = [],
  onCancelar,
  onGuardar,
}) => {
  const saldo = Number(factura.saldoPendiente ?? factura.total ?? 0);
  const [medios, setMedios] = useState([
    { medio: mediosOpciones[0] ?? 'Efectivo', monto: String(saldo), id_cuenta: '' },
  ]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [nroRecibo, setNroRecibo] = useState('');
  const [error, setError] = useState('');

  const totalMedios = medios.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

  const requiereCuenta = (medio) => MEDIOS_CON_CUENTA.includes(medio);

  const updateMedio = (idx, field, val) => {
    setMedios((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const updated = { ...row, [field]: val };
        if (field === 'medio' && !requiereCuenta(val)) {
          updated.id_cuenta = '';
        }
        return updated;
      }),
    );
  };

  const handleGuardar = () => {
    setError('');
    const mediosPayload = [];

    for (const m of medios) {
      const monto = Number(m.monto) || 0;
      if (monto <= 0) continue;
      if (requiereCuenta(m.medio) && !m.id_cuenta) {
        setError(`Seleccioná la cuenta bancaria para el cobro con ${m.medio}.`);
        return;
      }
      mediosPayload.push({
        medio: m.medio,
        monto,
        id_cuenta: m.id_cuenta ? Number(m.id_cuenta) : undefined,
      });
    }

    if (!mediosPayload.length) {
      setError('Ingresá al menos un medio de cobro con monto.');
      return;
    }

    if (Math.abs(totalMedios - saldo) > 0.009) {
      setError(
        `El total de medios (Gs. ${totalMedios.toLocaleString('de-DE')}) debe coincidir con el saldo a cobrar (Gs. ${saldo.toLocaleString('de-DE')}).`,
      );
      return;
    }

    onGuardar({
      facturaId: factura.id,
      fecha,
      nro_recibo: nroRecibo.trim() || undefined,
      medios: mediosPayload,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-100 max-w-lg w-full">
      <div className="bg-orange-600 p-4 flex justify-between items-center rounded-t-xl">
        <div>
          <h3 className="text-white font-bold">Registrar cobro</h3>
          <p className="text-white/90 text-xs">
            {clienteNombre} — Factura {factura.numero}
          </p>
        </div>
        <button type="button" onClick={onCancelar} className="text-white hover:bg-orange-600 rounded-full p-1">
          <X size={22} />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{error}</p>
        )}

        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm">
          <p className="flex justify-between">
            <span>Saldo a cobrar:</span>
            <span className="font-black text-orange-700">Gs. {saldo.toLocaleString('de-DE')}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600">Fecha de cobro</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Nº recibo (opcional)</label>
            <input
              type="text"
              value={nroRecibo}
              onChange={(e) => setNroRecibo(e.target.value)}
              placeholder="Auto"
              className="w-full p-2 border rounded mt-1"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-600">Medios de cobro</label>
            <button
              type="button"
              onClick={() =>
                setMedios((prev) => [...prev, { medio: mediosOpciones[0] ?? 'Efectivo', monto: '', id_cuenta: '' }])
              }
              className="text-[10px] font-bold text-orange-700 hover:underline"
            >
              + Agregar medio
            </button>
          </div>

          <div className="space-y-3">
            {medios.map((row, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <select
                    value={row.medio}
                    onChange={(e) => updateMedio(idx, 'medio', e.target.value)}
                    className="flex-1 p-1.5 border rounded text-xs bg-white font-medium"
                  >
                    {mediosOpciones.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <FormattedNumberInput
                    placeholder="Monto"
                    value={row.monto}
                    onChange={(val) => updateMedio(idx, 'monto', val)}
                    className="w-28 p-1.5 border rounded text-xs text-right font-mono"
                  />
                  {medios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMedios((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {requiereCuenta(row.medio) && (
                  <div className="flex gap-2 items-center">
                    <label className="text-[10px] uppercase font-bold text-gray-400 whitespace-nowrap">
                      Cuenta destino:
                    </label>
                    <select
                      value={row.id_cuenta || ''}
                      onChange={(e) => updateMedio(idx, 'id_cuenta', e.target.value)}
                      className="flex-1 p-1.5 border rounded text-[11px] bg-white"
                    >
                      <option value="">Seleccionar cuenta...</option>
                      {cuentas.map((c) => (
                        <option key={c.id_cuenta} value={c.id_cuenta}>
                          {c.banco} — {c.numero_cuenta} (Disp: Gs.{' '}
                          {Number(c.saldo_disponible ?? 0).toLocaleString('de-DE')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600 flex justify-between bg-green-50 p-2 rounded-lg">
          <span>Total medios:</span>
          <span className="font-black">Gs. {totalMedios.toLocaleString('de-DE')}</span>
        </p>
      </div>

      <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-xl">
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-lg text-gray-600 font-semibold">
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold flex items-center gap-2"
        >
          <Banknote size={18} /> Confirmar cobro
        </button>
      </div>
    </div>
  );
};

export default CobroFacturaForm;
