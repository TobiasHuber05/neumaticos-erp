import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Plus, XCircle } from 'lucide-react';
import { useModuloTesoreria } from '../hooks/useModuloTesoreria';
import GestionCuentas from './ModuloTesoreria/GestionCuentas';
import ConciliacionBancaria from './ModuloTesoreria/ConciliacionBancaria';
import MovimientoManualForm from './Forms/MovimientoManualForm';
import CuentaBancariaForm from './Forms/CuentaBancariaForm';
import { puedeEditar } from '../utils/permisos';

const Tesoreria = () => {
  const {
    cuentas,
    movimientos,
    bancos,
    registrarMovimiento,
    registrarCuenta,
    confirmarMovimientos,
  } = useModuloTesoreria();

  const [modo, setModo] = useState(null);

  const movimientosPendientes = movimientos.filter((mov) => !mov.fecha_confirmacion).length;
  const totalMovimientos = movimientos.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-erp-orange">
          <p className="text-xs uppercase text-gray-500 font-black">Cuentas registradas</p>
          <p className="text-3xl font-black text-gray-900 mt-3">{cuentas.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-green-500">
          <p className="text-xs uppercase text-gray-500 font-black">Movimientos totales</p>
          <p className="text-3xl font-black text-gray-900 mt-3">{totalMovimientos}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-blue-500">
          <p className="text-xs uppercase text-gray-500 font-black">Pendientes de confirmación</p>
          <p className="text-3xl font-black text-gray-900 mt-3">{movimientosPendientes}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {puedeEditar('tesoreria') && (
          <>
            <button
              type="button"
              onClick={() => setModo(modo === 'cuenta' ? null : 'cuenta')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-erp-orange text-white font-bold hover:bg-orange-600 transition"
            >
              <Plus size={18} /> Nueva cuenta
            </button>
            <button
              type="button"
              onClick={() => setModo(modo === 'movimiento' ? null : 'movimiento')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition"
            >
              <ArrowUpCircle size={18} /> Movimiento manual
            </button>
            <button
              type="button"
              onClick={() => setModo(modo === 'conciliacion' ? null : 'conciliacion')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
            >
              <ArrowDownCircle size={18} /> Conciliación
            </button>
          </>
        )}
        {modo && (
          <button
            type="button"
            onClick={() => setModo(null)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            <XCircle size={18} /> Cerrar formulario
          </button>
        )}
      </div>

      {modo === 'cuenta' && (
        <CuentaBancariaForm
          onCancelar={() => setModo(null)}
          onGuardar={(cuenta) => {
            registrarCuenta(cuenta);
            setModo(null);
          }}
        />
      )}

      {modo === 'movimiento' && (
        <MovimientoManualForm
          cuentas={cuentas}
          onCancelar={() => setModo(null)}
          onGuardar={(movimiento) => {
            registrarMovimiento(movimiento);
            setModo(null);
          }}
        />
      )}

      {modo === 'conciliacion' && (
        <ConciliacionBancaria
          cuentas={cuentas}
          movimientos={movimientos}
          onCancelar={() => setModo(null)}
          onConfirmarConciliacion={(ids) => {
            confirmarMovimientos(ids);
            setModo(null);
          }}
        />
      )}

      <GestionCuentas bancos={bancos} cuentas={cuentas} movimientos={movimientos} onNuevaCuenta={() => setModo('cuenta')} />
    </div>
  );
};

export default Tesoreria;
