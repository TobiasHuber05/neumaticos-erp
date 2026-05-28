import { useMemo, useState } from 'react';
import { X, Banknote } from 'lucide-react';

/**
 * Orden de pago con soporte de pagos parciales por factura.
 */
const OrdenPagoProveedoresForm = ({ proveedorNombre, facturasPendientes = [], mediosOpciones = [], cuentas = [], onCancelar, onGuardar }) => {
  const [seleccion, setSeleccion] = useState({});
<<<<<<< Updated upstream
  const [mediosFactura, setMediosFactura] = useState({}); // { facturaId: [{ medio: 'Efectivo', monto: '', id_cuenta: '' }] }
=======
  const [montosFactura, setMontosFactura] = useState({});
>>>>>>> Stashed changes
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [medios, setMedios] = useState([{ medio: mediosOpciones[0] ?? 'Efectivo', monto: '' }]);
  const [error, setError] = useState('');

  const saldoDe = (f) => Number(f.saldoPendiente ?? f.total ?? 0);

  const toggleFac = (f) => {
    const id = f.id;
    const activo = !seleccion[id];
    setSeleccion((s) => ({ ...s, [id]: activo }));
    if (activo) {
<<<<<<< Updated upstream
      setMediosFactura((m) => ({
        ...m,
        [id]: [{ medio: mediosOpciones[0] ?? 'Efectivo', monto: String(saldoDe(f)), id_cuenta: '' }]
      }));
=======
      setMontosFactura((m) => ({ ...m, [id]: String(saldoDe(f)) }));
>>>>>>> Stashed changes
    } else {
      setMontosFactura((m) => {
        const next = { ...m };
        delete next[id];
        return next;
      });
    }
  };

  const facturasSeleccionadas = useMemo(
    () => facturasPendientes.filter((f) => seleccion[f.id]),
    [facturasPendientes, seleccion]
  );

  const totalAplicarFacturas = useMemo(() => {
    return facturasSeleccionadas.reduce((acc, f) => {
      const m = Number(montosFactura[f.id]) || 0;
      return acc + m;
    }, 0);
  }, [facturasSeleccionadas, montosFactura]);

<<<<<<< Updated upstream
  const addMedioFactura = (facturaId) => {
    setMediosFactura(prev => ({
      ...prev,
      [facturaId]: [...(prev[facturaId] || []), { medio: mediosOpciones[0] ?? 'Efectivo', monto: '', id_cuenta: '' }]
    }));
  };

  const updateMedioFactura = (facturaId, idx, field, val) => {
    setMediosFactura(prev => ({
      ...prev,
      [facturaId]: prev[facturaId].map((row, i) => {
        if (i === idx) {
          const updated = { ...row, [field]: val };
          // If changing medio, reset id_cuenta if it's not a bank method
          if (field === 'medio' && val !== 'Transferencia bancaria' && val !== 'Cheque') {
            updated.id_cuenta = '';
          }
          return updated;
        }
        return row;
      })
    }));
=======
  const totalMedios = useMemo(
    () => medios.reduce((acc, m) => acc + (Number(m.monto) || 0), 0),
    [medios]
  );

  const addMedio = () => {
    setMedios((m) => [...m, { medio: mediosOpciones[0] ?? 'Efectivo', monto: '' }]);
  };

  const updateMedio = (idx, field, val) => {
    setMedios((m) => m.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
>>>>>>> Stashed changes
  };

  const removeMedio = (idx) => {
    setMedios((m) => (m.length <= 1 ? m : m.filter((_, i) => i !== idx)));
  };

  const handleGuardar = () => {
    setError('');

    if (!facturasSeleccionadas.length) {
      setError('Seleccioná al menos una factura.');
      return;
    }

    const facturas = [];
    for (const f of facturasSeleccionadas) {
      const monto = Number(montosFactura[f.id]) || 0;
      const saldo = saldoDe(f);
      if (monto <= 0) {
        setError(`Ingresá un monto mayor a 0 para ${f.numero}.`);
        return;
      }
      if (monto > saldo + 0.009) {
        setError(`El monto de ${f.numero} supera el saldo pendiente (Gs. ${saldo.toLocaleString('de-DE')}).`);
        return;
      }
<<<<<<< Updated upstream

      facturas.push({ id: f.id, monto: sumMonto });

      // Agregar los medios de pago con monto válido
      for (const m of mf) {
        const montoMedio = Number(m.monto) || 0;
        if (montoMedio > 0) {
          if ((m.medio === 'Transferencia bancaria' || m.medio === 'Cheque') && !m.id_cuenta) {
            setError(`Seleccioná la cuenta bancaria para el pago de Gs. ${montoMedio.toLocaleString('de-DE')} con ${m.medio} en ${f.numero}.`);
            return;
          }
          mediosPayload.push({
            medio: m.medio,
            monto: montoMedio,
            id_cuenta: m.id_cuenta ? Number(m.id_cuenta) : undefined
          });
        }
      }
=======
      facturas.push({ id: f.id, monto });
>>>>>>> Stashed changes
    }

    const mediosPayload = medios
      .map((m) => ({ medio: m.medio, monto: Number(m.monto) || 0 }))
      .filter((m) => m.monto > 0);

    if (!mediosPayload.length) {
      setError('Agregá al menos un medio de pago con monto.');
      return;
    }

    const sumMedios = mediosPayload.reduce((a, m) => a + m.monto, 0);
    const sumFacturas = facturas.reduce((a, f) => a + f.monto, 0);

    if (Math.abs(sumMedios - sumFacturas) > 0.009) {
      setError(
        `El total de medios (Gs. ${sumMedios.toLocaleString('de-DE')}) debe coincidir con el total a aplicar (Gs. ${sumFacturas.toLocaleString('de-DE')}).`
      );
      return;
    }

    onGuardar({ fecha, facturas, medios: mediosPayload });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-100 max-w-lg w-full">
      <div className="bg-erp-orange p-4 flex justify-between items-center rounded-t-xl">
        <div>
          <h3 className="text-white font-bold">Orden de pago</h3>
          <p className="text-white/90 text-xs">{proveedorNombre} — pagos parciales permitidos</p>
        </div>
        <button type="button" onClick={onCancelar} className="text-white hover:bg-orange-600 rounded-full p-1">
          <X size={22} />
        </button>
      </div>
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{error}</p>
        )}
        <div>
          <label className="text-xs font-bold text-gray-600">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full p-2 border rounded mt-1" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">Facturas con saldo pendiente</p>
          <ul className="space-y-3">
            {facturasPendientes.map((f) => {
              const saldo = saldoDe(f);
              const pagado = Number(f.totalPagado ?? 0);
              return (
                <li key={f.id} className="border border-gray-100 rounded-lg p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!seleccion[f.id]} onChange={() => toggleFac(f)} />
                    <span className="flex-1 font-medium">{f.numero}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Total Gs. {Number(f.total).toLocaleString('de-DE')}
                    {pagado > 0 && (
                      <> · Pagado Gs. {pagado.toLocaleString('de-DE')} · Saldo Gs. {saldo.toLocaleString('de-DE')}</>
                    )}
                    {f.estadoPago === 'Parcial' && (
                      <span className="ml-1 text-amber-700 font-bold">(Parcial)</span>
                    )}
                  </p>
                  {seleccion[f.id] && (
<<<<<<< Updated upstream
                    <div className="mt-3 ml-6 bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-gray-700">Formas de pago para esta factura:</label>
                        <button 
                          type="button" 
                          onClick={() => addMedioFactura(f.id)} 
                          className="text-[10px] font-bold text-erp-orange hover:underline bg-white px-2 py-1 rounded border border-orange-200"
                        >
                          + Agregar pago
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(mediosFactura[f.id] || []).map((row, idx) => (
                          <div key={idx} className="flex flex-col gap-2 border-b border-gray-100/80 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <select
                                value={row.medio}
                                onChange={(e) => updateMedioFactura(f.id, idx, 'medio', e.target.value)}
                                className="flex-1 p-1.5 border rounded text-xs bg-white font-medium"
                              >
                                {mediosOpciones.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                              <FormattedNumberInput
                                max={saldo}
                                placeholder="Monto"
                                value={row.monto}
                                onChange={(val) => updateMedioFactura(f.id, idx, 'monto', val)}
                                className="w-24 p-1.5 border rounded text-xs text-right bg-white font-mono"
                              />
                              <button 
                                type="button" 
                                onClick={() => removeMedioFactura(f.id, idx)} 
                                className="text-red-400 hover:text-red-600 text-xs px-1"
                                title="Eliminar"
                              >
                                ✕
                              </button>
                            </div>
                            {(row.medio === 'Transferencia bancaria' || row.medio === 'Cheque') && (
                              <div className="flex gap-2 items-center">
                                <label className="text-[10px] uppercase font-bold text-gray-400 whitespace-nowrap">Cuenta Origen:</label>
                                <select
                                  value={row.id_cuenta || ''}
                                  onChange={(e) => updateMedioFactura(f.id, idx, 'id_cuenta', e.target.value)}
                                  className="flex-1 p-1.5 border rounded text-[11px] bg-white font-medium text-gray-700"
                                >
                                  <option value="">Seleccionar cuenta bancaria...</option>
                                  {cuentas.map((c) => (
                                    <option key={c.id_cuenta} value={c.id_cuenta}>
                                      {c.banco} — {c.numero_cuenta} (Saldo: Gs. {Number(c.saldo_disponible ?? 0).toLocaleString('de-DE')})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          className="text-[10px] font-bold text-gray-500 hover:text-erp-orange hover:underline"
                          onClick={() => {
                            if (mediosFactura[f.id]?.length === 1) {
                              updateMedioFactura(f.id, 0, 'monto', String(saldo));
                            }
                          }}
                        >
                          Completar con el total (Gs. {saldo.toLocaleString('de-DE')})
                        </button>
                      </div>
=======
                    <div className="mt-2 ml-6 flex items-center gap-2">
                      <label className="text-xs text-gray-600 whitespace-nowrap">Monto a pagar:</label>
                      <input
                        type="number"
                        min={0}
                        max={saldo}
                        step="1"
                        value={montosFactura[f.id] ?? ''}
                        onChange={(e) => setMontosFactura((m) => ({ ...m, [f.id]: e.target.value }))}
                        className="flex-1 p-2 border rounded text-sm text-right"
                      />
                      <button
                        type="button"
                        className="text-[10px] font-bold text-erp-orange hover:underline"
                        onClick={() => setMontosFactura((m) => ({ ...m, [f.id]: String(saldo) }))}
                      >
                        Total saldo
                      </button>
>>>>>>> Stashed changes
                    </div>
                  )}
                </li>
              );
            })}
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
          {totalAplicarFacturas > 0 && (
            <button
              type="button"
              className="text-[10px] font-bold text-erp-orange hover:underline mt-1"
              onClick={() => setMedios([{ medio: mediosOpciones[0] ?? 'Efectivo', monto: String(totalAplicarFacturas) }])}
            >
              Usar un solo medio por Gs. {totalAplicarFacturas.toLocaleString('de-DE')}
            </button>
          )}
        </div>
        <div className="text-sm text-gray-700 space-y-1 bg-gray-50 rounded-lg p-3">
          <p>
            Total a aplicar en facturas:{' '}
            <span className="font-black">Gs. {totalAplicarFacturas.toLocaleString('de-DE')}</span>
          </p>
          <p>
            Total medios de pago:{' '}
            <span className={`font-black ${Math.abs(totalMedios - totalAplicarFacturas) > 0.009 && totalAplicarFacturas > 0 ? 'text-red-600' : ''}`}>
              Gs. {totalMedios.toLocaleString('de-DE')}
            </span>
          </p>
        </div>
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
