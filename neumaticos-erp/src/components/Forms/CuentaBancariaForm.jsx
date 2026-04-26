import React, { useEffect, useState } from 'react';
import { X, Save, Banknote } from 'lucide-react';

const emptyCuenta = {
  id_banco: '',
  id_moneda: '',
  numero_cuenta: '',
  tipo_cuenta: 'Cuenta Corriente',
  saldo: '',
  saldo_disponible: '',
};

const CuentaBancariaForm = ({ bancos = [], monedas = [], initial = null, onCancelar, onGuardar }) => {
  const [form, setForm] = useState(emptyCuenta);

  useEffect(() => {
    if (initial) {
      setForm({
        id_banco: initial.id_banco ?? '',
        id_moneda: initial.id_moneda ?? '',
        numero_cuenta: initial.numero_cuenta ?? '',
        tipo_cuenta: initial.tipo_cuenta ?? 'Cuenta Corriente',
        saldo: initial.saldo != null ? String(initial.saldo) : '',
        saldo_disponible: initial.saldo_disponible != null ? String(initial.saldo_disponible) : '',
      });
    } else {
      setForm(emptyCuenta);
    }
  }, [initial]);

  const handleGuardar = () => {
    if (!form.id_banco || !form.id_moneda || !form.numero_cuenta.trim()) return;

    onGuardar({
      ...(initial?.id_cuenta ? { id_cuenta: initial.id_cuenta } : {}),
      id_banco: Number(form.id_banco),
      id_moneda: Number(form.id_moneda),
      numero_cuenta: form.numero_cuenta.trim(),
      tipo_cuenta: form.tipo_cuenta,
      saldo: Number(form.saldo) || 0,
      saldo_disponible: Number(form.saldo_disponible) || 0,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden max-w-2xl mx-auto">
      <div className="bg-erp-orange p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white">
          <Banknote size={22} />
          <div>
            <h2 className="font-bold text-lg">{initial ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}</h2>
            <p className="text-[12px] text-orange-100">Datos de cuentas y saldos iniciales</p>
          </div>
        </div>
        <button type="button" onClick={onCancelar} className="rounded-full p-2 hover:bg-orange-500/30 text-white">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Banco</label>
            <select
              value={form.id_banco}
              onChange={(e) => setForm((prev) => ({ ...prev, id_banco: e.target.value }))}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
            >
              <option value="">Seleccionar banco</option>
              {bancos.map((banco) => (
                <option key={banco.id_banco} value={banco.id_banco}>
                  {banco.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Moneda</label>
            <select
              value={form.id_moneda}
              onChange={(e) => setForm((prev) => ({ ...prev, id_moneda: e.target.value }))}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
            >
              <option value="">Seleccionar moneda</option>
              {monedas.map((moneda) => (
                <option key={moneda.id_moneda} value={moneda.id_moneda}>
                  {moneda.nombre} ({moneda.simbolo})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Número de cuenta</label>
            <input
              type="text"
              value={form.numero_cuenta}
              onChange={(e) => setForm((prev) => ({ ...prev, numero_cuenta: e.target.value }))}
              placeholder="Ej: 1234567-0"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de cuenta</label>
            <select
              value={form.tipo_cuenta}
              onChange={(e) => setForm((prev) => ({ ...prev, tipo_cuenta: e.target.value }))}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
            >
              <option value="Cuenta Corriente">Cuenta Corriente</option>
              <option value="Caja de Ahorro">Caja de Ahorro</option>
              <option value="Cuenta Sueldo">Cuenta Sueldo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Saldo inicial</label>
            <input
              type="number"
              value={form.saldo}
              onChange={(e) => setForm((prev) => ({ ...prev, saldo: e.target.value }))}
              placeholder="0"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Saldo disponible</label>
            <input
              type="number"
              value={form.saldo_disponible}
              onChange={(e) => setForm((prev) => ({ ...prev, saldo_disponible: e.target.value }))}
              placeholder="0"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
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
            <Save size={18} /> Guardar cuenta
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuentaBancariaForm;

