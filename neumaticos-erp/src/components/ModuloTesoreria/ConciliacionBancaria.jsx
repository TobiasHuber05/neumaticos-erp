import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { calcularSaldosDeCuenta } from '../../utils/tesoreriasLogis';
import { puedeEditar } from '../../utils/permisos';

const nombreBancoCuenta = (cuenta) => {
  if (!cuenta) return '—';
  if (typeof cuenta.banco === 'string') return cuenta.banco;
  return cuenta.banco?.nombre ?? '—';
};

const ConciliacionBancaria = ({
  movimientos,
  cuentas,
  conciliaciones = [],
  onCrear,
  onVincular,
  onFinalizar,
  onGetDetalle,
  onConciliacionCompletada,
}) => {
  const [cuentaId, setCuentaId] = useState('');
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [conciliacionActiva, setConciliacionActiva] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [saldoBanco, setSaldoBanco] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cuentaActiva = useMemo(
    () => cuentas.find((c) => c.id_cuenta === Number(cuentaId)),
    [cuentas, cuentaId],
  );

  useEffect(() => {
    if (conciliacionActiva?.id_cuenta) {
      setCuentaId(String(conciliacionActiva.id_cuenta));
    }
  }, [conciliacionActiva]);

  const movimientosCuenta = useMemo(() => {
    if (!cuentaId) return [];
    return movimientos.filter((m) => m.id_cuenta === Number(cuentaId));
  }, [movimientos, cuentaId]);

  /** Movimientos sin confirmar: cheques emitidos, depósitos pendientes, etc. */
  const movimientosPendientes = useMemo(
    () => movimientosCuenta.filter((m) => !m.fecha_confirmacion),
    [movimientosCuenta],
  );

  const saldoSegunLibros = useMemo(() => {
    if (!cuentaActiva) return 0;
    const { saldoReal } = calcularSaldosDeCuenta(
      movimientosCuenta,
      cuentaActiva.saldo_inicial ?? cuentaActiva.saldo ?? 0,
      cuentaActiva.saldo_disponible_inicial ?? cuentaActiva.saldo_disponible ?? 0,
    );
    return saldoReal;
  }, [cuentaActiva, movimientosCuenta]);

  const totalSeleccionado = useMemo(() => {
    const sum = seleccionados.reduce((acc, id) => {
      const m = movimientos.find((mov) => mov.id_movimiento === id);
      if (!m) return acc;
      return acc + Number(m.monto_ingreso ?? 0) - Number(m.monto_egreso ?? 0);
    }, 0);
    return Math.round(sum * 100) / 100;
  }, [seleccionados, movimientos]);

  /** Diferencia entre saldo del extracto y saldo según libros del ERP */
  const diferenciaCierre = useMemo(() => {
    const extracto = Number(saldoBanco || 0);
    return Math.round((extracto - saldoSegunLibros) * 100) / 100;
  }, [saldoBanco, saldoSegunLibros]);

  const handleCrear = async () => {
    if (!cuentaId || saldoBanco === '') return;
    setGuardando(true);
    const res = await onCrear({
      id_cuenta: Number(cuentaId),
      fecha: new Date().toISOString(),
      descripcion: descripcion || `Conciliación ${new Date().toLocaleDateString()}`,
      saldo_banco: Number(saldoBanco),
    });
    setGuardando(false);

    if (res.ok) {
      setConciliacionActiva(res.data);
      setCuentaId(String(res.data.id_cuenta));
      setSeleccionados([]);
      setShowModalNueva(false);
    }
  };

  const toggleMovimiento = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const seleccionarTodosPendientes = () => {
    setSeleccionados(movimientosPendientes.map((m) => m.id_movimiento));
  };

  const puedeFinalizarSinMovimientos =
    movimientosPendientes.length === 0 && Math.abs(diferenciaCierre) < 0.01;

  const handleFinalizar = async () => {
    if (!seleccionados.length && !puedeFinalizarSinMovimientos) {
      alert(
        'Seleccioná los movimientos del extracto que querés confirmar (por ejemplo, cheques cobrados).',
      );
      return;
    }

    if (Math.abs(diferenciaCierre) > 0.01) {
      const continuar = window.confirm(
        `El saldo del extracto (Gs. ${Number(saldoBanco).toLocaleString('de-DE')}) no coincide con el saldo según libros (Gs. ${saldoSegunLibros.toLocaleString('de-DE')}). Diferencia: Gs. ${diferenciaCierre.toLocaleString('de-DE')}.\n\n¿Deseás finalizar igualmente confirmando los ${seleccionados.length} movimiento(s) seleccionado(s)?`,
      );
      if (!continuar) return;
    }

    setGuardando(true);
    const resVincular = await onVincular(conciliacionActiva.id_conciliacion, seleccionados);
    if (!resVincular?.ok) {
      setGuardando(false);
      alert(resVincular?.error ?? 'Error al vincular movimientos');
      return;
    }

    const res = await onFinalizar(conciliacionActiva.id_conciliacion);
    setGuardando(false);

    if (res?.ok) {
      setConciliacionActiva(null);
      setSeleccionados([]);
      setSaldoBanco('');
      setCuentaId('');
      setDescripcion('');
      await onConciliacionCompletada?.();
    } else {
      alert(res?.error ?? 'Error al finalizar la conciliación');
    }
  };

  const reanudarConciliacion = async (c) => {
    if (c.estado !== 'Pendiente') return;
    const detalle = await onGetDetalle(c.id_conciliacion);
    setCuentaId(String(c.id_cuenta));
    setSaldoBanco(String(c.saldo_banco ?? ''));
    setDescripcion(c.descripcion ?? '');
    if (detalle?.detalle_conciliacion?.length) {
      setSeleccionados(detalle.detalle_conciliacion.map((d) => d.id_movimiento));
    } else {
      setSeleccionados([]);
    }
    setConciliacionActiva(c);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Conciliación Bancaria</h1>
          <p className="text-gray-500 text-sm mt-1">
            Confirmá cheques y depósitos pendientes contra el extracto del banco
          </p>
        </div>
        {!conciliacionActiva && puedeEditar('tesoreria') && (
          <button
            type="button"
            onClick={() => setShowModalNueva(true)}
            className="px-6 py-3 bg-erp-orange text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg transition-all"
          >
            Nueva Conciliación
          </button>
        )}
      </div>

      {!conciliacionActiva ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <span className="font-bold text-gray-700">Últimas conciliaciones</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                <tr>
                  <th className="px-6 py-4 text-left">Fecha</th>
                  <th className="px-6 py-4 text-left">Cuenta / Banco</th>
                  <th className="px-6 py-4 text-right">Saldo extracto</th>
                  <th className="px-6 py-4 text-right">Dif. cierre</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {conciliaciones.map((c) => (
                  <tr
                    key={c.id_conciliacion}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => reanudarConciliacion(c)}
                  >
                    <td className="px-6 py-4 text-sm">{c.fecha}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{c.numero_cuenta}</div>
                      <div className="text-xs text-gray-500">{c.banco}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-700">
                      Gs. {Number(c.saldo_banco).toLocaleString('de-DE')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      Gs. {Number(c.diferencia ?? 0).toLocaleString('de-DE')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                          c.estado === 'Cerrada'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {c.estado}
                      </span>
                      {c.estado === 'Pendiente' && (
                        <p className="text-[9px] text-erp-orange font-bold mt-1">Click para continuar</p>
                      )}
                    </td>
                  </tr>
                ))}
                {!conciliaciones.length && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">
                      No hay conciliaciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
            <strong>Cuenta:</strong> {cuentaActiva?.numero_cuenta} — {nombreBancoCuenta(cuentaActiva)}
            {conciliacionActiva.descripcion && (
              <span className="ml-2 text-blue-700">({conciliacionActiva.descripcion})</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border-2 border-erp-orange shadow-sm">
              <label className="block text-[10px] font-black text-gray-400 uppercase">
                Saldo extracto banco
              </label>
              <div className="text-xl font-black text-gray-800">
                Gs. {Number(saldoBanco || 0).toLocaleString('de-DE')}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-black text-gray-400 uppercase">
                Saldo según libros (ERP)
              </label>
              <div className="text-xl font-black text-gray-800">
                Gs. {saldoSegunLibros.toLocaleString('de-DE')}
              </div>
            </div>
            <div
              className={`bg-white p-5 rounded-2xl shadow-sm border-2 ${
                Math.abs(diferenciaCierre) < 0.01 ? 'border-green-500 bg-green-50' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <label className="block text-[10px] font-black text-gray-400 uppercase">
                Diferencia de cierre
              </label>
              <div
                className={`text-xl font-black ${
                  Math.abs(diferenciaCierre) < 0.01 ? 'text-green-600' : 'text-amber-700'
                }`}
              >
                Gs. {diferenciaCierre.toLocaleString('de-DE')}
              </div>
              <p className="text-[9px] text-gray-500 mt-1">Extracto − libros</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-black text-gray-400 uppercase">
                Total a confirmar
              </label>
              <div className="text-xl font-black text-erp-orange">
                Gs. {totalSeleccionado.toLocaleString('de-DE')}
              </div>
              <p className="text-[9px] text-gray-500 mt-1">{seleccionados.length} movimiento(s)</p>
            </div>
            <div className="flex items-center justify-center">
              {puedeEditar('tesoreria') && (
                <button
                  type="button"
                  onClick={handleFinalizar}
                  disabled={guardando || (!seleccionados.length && !puedeFinalizarSinMovimientos)}
                  className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg hover:bg-green-700 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={22} />
                  {guardando ? 'Guardando...' : 'Finalizar'}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConciliacionActiva(null);
                    setSeleccionados([]);
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="font-bold text-gray-700 uppercase text-xs">
                  Movimientos pendientes de confirmación ({movimientosPendientes.length})
                </span>
              </div>
              <div className="flex gap-2">
                {movimientosPendientes.length > 0 && (
                  <button
                    type="button"
                    onClick={seleccionarTodosPendientes}
                    className="text-xs font-bold text-erp-orange hover:underline"
                  >
                    Seleccionar todos
                  </button>
                )}
                <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  {seleccionados.length} marcados
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-6 py-4 w-10" />
                    <th className="px-6 py-4 text-left">Fecha</th>
                    <th className="px-6 py-4 text-left">Concepto / Tipo</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movimientosPendientes.map((m) => {
                    const monto =
                      Number(m.monto_ingreso) > 0
                        ? Number(m.monto_ingreso)
                        : -Number(m.monto_egreso);
                    const isSelected = seleccionados.includes(m.id_movimiento);

                    return (
                      <tr
                        key={m.id_movimiento}
                        onClick={() => toggleMovimiento(m.id_movimiento)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            {isSelected && <CheckCircle size={14} />}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                          {m.fecha_movimiento}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{m.concepto}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">
                            {m.tipo_deposito || m.tipo_movimiento}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black">
                          <span className={monto >= 0 ? 'text-green-600' : 'text-red-600'}>
                            Gs. {monto.toLocaleString('de-DE')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!movimientosPendientes.length && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        No hay movimientos pendientes en esta cuenta. Los ingresos por transferencia y
                        efectivo ya están confirmados. Podés finalizar si el saldo de cierre coincide con
                        los libros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModalNueva && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-erp-orange p-6 text-white text-center">
              <Info className="mx-auto mb-2 opacity-50" size={32} />
              <h2 className="text-xl font-bold">Iniciar conciliación</h2>
              <p className="text-orange-100 text-xs mt-1">
                Ingresá el saldo de cierre del extracto para compararlo con el ERP
              </p>
            </div>

            <div className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Cuenta bancaria
                </label>
                <select
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                  className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-erp-orange outline-none"
                >
                  <option value="">Seleccionar cuenta...</option>
                  {cuentas.map((c) => (
                    <option key={c.id_cuenta} value={c.id_cuenta}>
                      {c.numero_cuenta} — {nombreBancoCuenta(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Saldo de cierre (extracto bancario)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={saldoBanco}
                  onChange={(e) => setSaldoBanco(e.target.value)}
                  className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-erp-orange outline-none font-black text-lg"
                />
                {cuentaId && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Saldo según libros hoy: Gs.{' '}
                    {(() => {
                      const cta = cuentas.find((c) => c.id_cuenta === Number(cuentaId));
                      if (!cta) return '—';
                      const movs = movimientos.filter((m) => m.id_cuenta === Number(cuentaId));
                      const { saldoReal } = calcularSaldosDeCuenta(
                        movs,
                        cta.saldo_inicial ?? cta.saldo ?? 0,
                        cta.saldo_disponible_inicial ?? cta.saldo_disponible ?? 0,
                      );
                      return saldoReal.toLocaleString('de-DE');
                    })()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Descripción / período
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mayo 2026"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-erp-orange outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModalNueva(false)}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCrear}
                  disabled={!cuentaId || saldoBanco === '' || guardando}
                  className="flex-1 py-3 bg-erp-orange text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-40"
                >
                  {guardando ? 'Creando...' : 'Empezar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConciliacionBancaria;
