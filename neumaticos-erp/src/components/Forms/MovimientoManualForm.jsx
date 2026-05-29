import React, { useState } from 'react';
import { X, Save, CircleDollarSign } from 'lucide-react';

const MovimientoManualForm = ({ cuentas = [], onCancelar, onGuardar }) => {
  const [idCuenta, setIdCuenta] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('Crédito');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [fechaMovimiento, setFechaMovimiento] = useState(new Date().toISOString().slice(0, 10));
  const [fechaConfirmacion, setFechaConfirmacion] = useState('');
  const [instrumento, setInstrumento] = useState('Efectivo');
  const [tipoContable, setTipoContable] = useState('deposito');

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
      tipo_deposito: instrumento,
      tipo_contable: tipoContable,
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
              onChange={(e) => {
                const val = e.target.value;
                setTipoMovimiento(val);
                setTipoContable(val === 'Crédito' ? 'deposito' : 'gasto_bancario');
                setInstrumento(val === 'Crédito' ? 'Efectivo' : 'Transferencia');
              }}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
            >
              <option value="Crédito">Crédito (Ingreso)</option>
              <option value="Débito">Débito (Egreso)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Medio / Instrumento</label>
            <select 
              value={instrumento} 
              onChange={(e) => setInstrumento(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
            >
              {tipoMovimiento === 'Crédito' ? (
                <>
                  <option value="Efectivo">Efectivo / Mismo Banco</option>
                  <option value="Cheque Otro Banco">Cheque de otro banco (48hs)</option>
                  <option value="Transferencia">Transferencia Recibida</option>
                </>
              ) : (
                <>
                  <option value="Transferencia">Transferencia Bancaria (Inmediato)</option>
                  <option value="Cheque Propio">Cheque Propio (Diferido)</option>
                  <option value="Retiro Efectivo">Retiro de Efectivo</option>
                </>
              )}
            </select>
          </div>

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
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo contable</label>
          <select
            value={tipoContable}
            onChange={(e) => setTipoContable(e.target.value)}
            className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
          >
            {tipoMovimiento === 'Crédito' ? (
              <>
                <option value="deposito">Depósito (Ingreso en efectivo/transferencia)</option>
                <option value="intereses">Intereses</option>
              </>
            ) : (
              <>
                <option value="gasto_bancario">Gasto bancario (Chequera, comisiones, multas)</option>
                <option value="cheque_rechazado">Cheque rechazado</option>
              </>
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha confirmación (Conciliación)</label>
            <input
              type="date"
              value={fechaConfirmacion}
              onChange={(e) => setFechaConfirmacion(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Concepto / Referencia</label>
          <input
            type="text"
            required
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej: Pago de servicios, Depósito de cliente..."
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

