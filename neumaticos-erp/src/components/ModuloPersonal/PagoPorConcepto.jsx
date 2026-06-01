import { useState, useMemo } from 'react';
import { X, Plus, Trash2, DollarSign, Users, Calendar, Calculator, AlertTriangle } from 'lucide-react';
import { formatGua } from '../../utils/personalLogic';

const SALARIO_MINIMO = 2680373;
const PORCENTAJE_IPS = 0.09;
const PORCENTAJE_BONIF = 0.05;

const PagoPorConcepto = ({ personal, cuentas = [], onClose }) => {
  const { funcionarios, conceptos, config, actions } = personal;
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedFuncs, setSelectedFuncs] = useState(new Set());
  const [conceptosPorFunc, setConceptosPorFunc] = useState({});
  const [cuentaId, setCuentaId] = useState('');
  const [saldoError, setSaldoError] = useState('');

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedFuncs(new Set());
      setSelectAll(false);
    } else {
      setSelectedFuncs(new Set(funcionarios.map(f => f.id)));
      setSelectAll(true);
    }
  };

  const toggleFunc = (id) => {
    const next = new Set(selectedFuncs);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedFuncs(next);
    setSelectAll(next.size === funcionarios.length);
  };

  const agregarConcepto = (funcId, concepto) => {
    setConceptosPorFunc(prev => {
      const actual = [...(prev[funcId] || [])];
      if (actual.some(c => c.conceptoId === concepto.id_concepto)) return prev;
      actual.push({
        conceptoId: concepto.id_concepto,
        nombre: concepto.nombre,
        tipo: concepto.credito !== null ? 'Ingreso' : 'Egreso',
        monto: 0,
        afecta_ips: concepto.afecta_ips ?? false,
      });
      return { ...prev, [funcId]: actual };
    });
  };

  const quitarConcepto = (funcId, conceptoId) => {
    setConceptosPorFunc(prev => ({
      ...prev,
      [funcId]: (prev[funcId] || []).filter(c => c.conceptoId !== conceptoId),
    }));
  };

  const setMontoConcepto = (funcId, conceptoId, monto) => {
    setConceptosPorFunc(prev => ({
      ...prev,
      [funcId]: (prev[funcId] || []).map(c =>
        c.conceptoId === conceptoId ? { ...c, monto: Number(monto) || 0 } : c
      ),
    }));
  };

  const calcularRegularNeto = (func) => {
    const sb = func.salarioBase || 0;
    const hijosMenores = func.hijos_menores || 0;
    const bonif = hijosMenores * (SALARIO_MINIMO * PORCENTAJE_BONIF);
    const baseIPS = sb;
    const ips = baseIPS * PORCENTAJE_IPS;
    return Math.max(0, sb + bonif - ips);
  };

  const calcularTotalAdelanto = (funcId) => {
    const cs = conceptosPorFunc[funcId] || [];
    return cs.reduce((sum, c) => sum + (c.tipo === 'Ingreso' ? c.monto : -c.monto), 0);
  };

  const calcularProximoDesembolso = (func) => {
    const regular = calcularRegularNeto(func);
    const adelanto = calcularTotalAdelanto(func.id);
    return Math.max(0, regular - adelanto);
  };

  const calcularTotalGeneral = () => {
    let total = 0;
    for (const fid of selectedFuncs) {
      total += calcularTotalAdelanto(fid);
    }
    return total;
  };

  const conceptosBase = useMemo(() => {
    return conceptos.filter(c => c.id_sueldo === null && c.id_funcionario === null);
  }, [conceptos]);

  const handlePagar = async () => {
    if (selectedFuncs.size === 0) return;
    if (!cuentaId) return;
    const funcionariosPayload = [];
    for (const fid of selectedFuncs) {
      const cs = conceptosPorFunc[fid] || [];
      if (cs.length === 0 || cs.every(c => !c.monto || c.monto <= 0)) continue;
      funcionariosPayload.push({
        id_funcionario: fid,
        conceptos: cs.map(c => ({
          nombre: c.nombre,
          tipo: c.tipo,
          monto: c.monto,
          afecta_ips: c.afecta_ips,
        })),
      });
    }
    if (funcionariosPayload.length === 0) return;
    try {
      await actions.pagarAdelanto({
        periodo: fechaPago.slice(0, 7),
        fecha_pago: fechaPago,
        id_cuenta: Number(cuentaId),
        funcionarios: funcionariosPayload,
      });
      onClose();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Error al procesar el pago';
      if (errorMsg.includes('Saldo insuficiente')) {
        setSaldoError(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
              <DollarSign className="text-erp-orange" size={22} />
              Pago por Concepto
            </h2>
            <p className="text-xs text-gray-500 font-medium">Adelantos, bonos y pagos extraordinarios</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Fecha */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <span className="text-xs font-black text-gray-500 uppercase">Fecha de Pago</span>
            </div>
            <input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange outline-none text-sm font-medium" />
          </div>

          {/* Funcionarios */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-gray-400" />
                <span className="text-xs font-black text-gray-500 uppercase">Funcionarios</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer">
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll}
                  className="w-4 h-4 accent-erp-orange rounded" />
                Seleccionar todos
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {funcionarios.map(func => {
                const selected = selectedFuncs.has(func.id);
                const totalAdel = calcularTotalAdelanto(func.id);
                return (
                  <div key={func.id}
                    onClick={() => toggleFunc(func.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selected ? 'border-erp-orange bg-orange-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <input type="checkbox" checked={selected} readOnly
                        className="w-4 h-4 accent-erp-orange rounded pointer-events-none" />
                      <span className="font-bold text-sm text-gray-800 truncate">{func.nombre}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium ml-6">
                      {func.cargoActual} — {formatGua(func.salarioBase)}
                    </div>
                    {selected && totalAdel > 0 && (
                      <div className="mt-1 ml-6 text-[10px] font-black text-erp-orange">
                        Adelanto: {formatGua(totalAdel)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conceptos por funcionario */}
          {selectedFuncs.size > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-gray-400" />
                <span className="text-xs font-black text-gray-500 uppercase">Conceptos a Pagar</span>
              </div>
              {Array.from(selectedFuncs).map(fid => {
                const func = funcionarios.find(f => f.id === fid);
                if (!func) return null;
                const cs = conceptosPorFunc[fid] || [];
                const totalAdel = calcularTotalAdelanto(fid);
                const proxDesemb = calcularProximoDesembolso(func);
                const regular = calcularRegularNeto(func);

                return (
                  <div key={fid} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-bold text-gray-800">{func.nombre}</h4>
                        <p className="text-[10px] text-gray-400">{func.cargoActual}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-erp-orange">{formatGua(totalAdel)}</div>
                        <div className="text-[10px] text-gray-400 font-medium">Total adelanto</div>
                      </div>
                    </div>

                    {/* Agregar concepto */}
                    <div className="flex gap-2 mb-3">
                      <select
                        onChange={e => {
                          const conc = conceptosBase.find(c => c.id_concepto === Number(e.target.value));
                          if (conc) agregarConcepto(fid, conc);
                          e.target.value = '';
                        }}
                        value=""
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-erp-orange outline-none bg-white">
                        <option value="">+ Agregar concepto...</option>
                        {conceptosBase.map(c => (
                          <option key={c.id_concepto} value={c.id_concepto}>
                            {c.nombre} ({c.credito !== null ? 'Ingreso' : 'Egreso'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Conceptos agregados */}
                    {cs.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {cs.map(c => (
                          <div key={c.conceptoId} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-700 truncate">{c.nombre}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  c.tipo === 'Ingreso' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                  {c.tipo}
                                </span>
                              </div>
                            </div>
                            <input type="number" value={c.monto || ''}
                              onChange={e => setMontoConcepto(fid, c.conceptoId, e.target.value)}
                              className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-right focus:ring-2 focus:ring-erp-orange outline-none"
                              placeholder="Monto" min="0" />
                            <button onClick={() => quitarConcepto(fid, c.conceptoId)}
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic text-center py-2">
                        No hay conceptos agregados. Seleccioná uno del menú desplegable.
                      </p>
                    )}

                    {/* Proyección próximo desembolso */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">Próximo desembolso regular</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-amber-500 font-medium">
                          Salario regular: {formatGua(regular)}
                          {totalAdel > 0 && <> — Adelanto: {formatGua(totalAdel)}</>}
                        </div>
                        <div className="font-black text-amber-800">
                          ≈ {formatGua(proxDesemb)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedFuncs.size === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">Seleccioná al menos un funcionario</p>
              <p className="text-xs mt-1">Luego agregá los conceptos a pagar</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedFuncs.size > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 space-y-4">
            {/* Selector de cuenta */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                Cuenta bancaria para el pago <span className="text-red-500">*</span>
              </label>
              <select
                value={cuentaId}
                onChange={(e) => { setCuentaId(e.target.value); setSaldoError(''); }}
                className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-erp-orange outline-none text-sm font-medium bg-white"
              >
                <option value="">Seleccionar cuenta...</option>
                {cuentas.map((cta) => (
                  <option key={cta.id_cuenta} value={cta.id_cuenta}>
                    {cta.banco} — Cta. Nº {cta.numero_cuenta}
                    {cta.saldo != null ? ` (Gs. ${Number(cta.saldo).toLocaleString('de-DE')})` : ''}
                  </option>
                ))}
              </select>
              {!cuentaId && (
                <p className="text-[10px] text-amber-600 font-bold">⚠️ Debes seleccionar una cuenta para continuar.</p>
              )}
              {saldoError && (
                <p className="text-[10px] text-red-600 font-bold mt-1">❌ {saldoError}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-gray-500 uppercase">Total a pagar</span>
                <div className="text-2xl font-black text-erp-orange">{formatGua(calcularTotalGeneral())}</div>
              </div>
              <div className="text-right text-[10px] text-gray-400 font-medium">
                {selectedFuncs.size} funcionario(s) seleccionado(s)
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handlePagar} disabled={calcularTotalGeneral() <= 0 || !cuentaId}
                className="flex-1 py-3.5 bg-erp-orange text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-40 disabled:cursor-not-allowed">
                Confirmar y Pagar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagoPorConcepto;