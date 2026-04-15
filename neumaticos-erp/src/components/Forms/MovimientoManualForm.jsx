import React, { useState } from 'react';
import { X, Save, CircleDollarSign } from 'lucide-react';

const MovimientoManualForm = ({ cuentas = [], onCancelar, onGuardar }) => {
  const [idCuenta, setIdCuenta] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('Crédito');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [fechaMovimiento, setFechaMovimiento] = useState(new Date().toISOString().slice(0, 10));
  const [fechaConfirmacion, setFechaConfirmacion] = useState('');
  const [tipoDeposito, setTipoDeposito] = useState('Efectivo');

  const handleGuardar = () => {
    if (!idCuenta || !monto || !concepto.trim()) return;

    onGuardar({
      id_cuenta: Number(idCuenta),
      monto_ingreso: tipoMovimiento === 'Crédito' ? Number(monto) : 0,
      monto_egreso: tipoMovimiento === 'Débito' ? Number(monto) : 0,
      fecha_movimiento: fechaMovimiento,
      fecha_confirmacion: fechaConfirmacion || null,
      tipo_movimiento: tipoMovimiento,
      concepto: concepto.trim(),
      tipo_deposito: tipoMovimiento === 'Crédito' ? tipoDeposito : null,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden max-w-2xl mx-auto">
      <div className="bg-erp-orange p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white">
          <CircleDollarSign size={22} />
          <div>
            <h2 className="font-bold text-lg">Movimiento Manual</h2>
            <p className="text-[12px] text-orange-100">Registra ingresos o egresos manualmente</p>
          </div>
        </div>
        <button type="button" onClick={onCancelar} className="rounded-full p-2 hover:bg-orange-500/30 text-white">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cuenta</label>
            <select
              required
              value={idCuenta}
              onChange={(e) => setIdCuenta(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
            >
              <option value="">Seleccionar cuenta</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.id_cuenta} value={cuenta.id_cuenta}>
                  {cuenta.numero_cuenta} — {cuenta.tipo_cuenta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de movimiento</label>
            <select
              value={tipoMovimiento}
              onChange={(e) => setTipoMovimiento(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
            >
              <option value="Crédito">Crédito</option>
              <option value="Débito">Débito</option>
            </select>
          </div>

          {tipoMovimiento === 'Crédito' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Depósito</label>
              <select 
                value={tipoDeposito} 
                onChange={(e) => setTipoDeposito(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
              <option value="Efectivo">Efectivo / Mismo Banco</option>
              <option value="Cheque Otro Banco">Cheque de otro banco (48hs)</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Monto</label>
            <input
              type="number"
              required
              min="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha movimiento</label>
            <input
              type="date"
              value={fechaMovimiento}
              onChange={(e) => setFechaMovimiento(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha confirmación</label>
            <input
              type="date"
              value={fechaConfirmacion}
              onChange={(e) => setFechaConfirmacion(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Concepto</label>
          <input
            type="text"
            required
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Descripción del movimiento"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            className="px-5 py-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="px-5 py-3 rounded-lg bg-erp-orange text-white font-bold hover:bg-orange-600 flex items-center gap-2"
          >
            <Save size={18} /> Guardar movimiento
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovimientoManualForm;
