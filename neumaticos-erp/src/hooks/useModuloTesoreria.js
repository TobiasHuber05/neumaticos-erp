import { useState, useMemo } from 'react';
import { 
  BANCOS, 
  CUENTAS_BANCARIAS, 
  MOVIMIENTOS_BANCARIOS 
} from '../data/erpInitialTesoreria';

export const useModuloTesoreria = () => {
  const [cuentas, setCuentas] = useState(CUENTAS_BANCARIAS);
  const [movimientos, setMovimientos] = useState(MOVIMIENTOS_BANCARIOS);

  // Lógica para obtener el saldo real y disponible por cuenta
  const obtenerEstadoCuenta = (cuentaId) => {
    const cuenta = cuentas.find(c => c.id === cuentaId);
    const movs = movimientos.filter(m => m.id_cuenta === cuentaId);

    // Saldo Real: Todo lo registrado
    const saldoReal = movs.reduce((acc, m) => acc + (m.monto_ingreso - m.monto_egreso), 0);

    // Saldo Disponible: Solo lo que tiene fecha_confirmacion o no es un depósito pendiente
    const saldoDisponible = movs.reduce((acc, m) => {
      if (m.monto_ingreso > 0 && !m.fecha_confirmacion) {
        return acc; // Si es ingreso pero no está confirmado, no suma al disponible
      }
      return acc + (m.monto_ingreso - m.monto_egreso);
    }, 0);

    return { ...cuenta, saldoReal, saldoDisponible };
  };

const registrarMovimiento = (nuevoMov) => {
    const esInmediato = debeConfirmarInmediatamente(nuevoMov.tipo_deposito || nuevoMov.tipo_movimiento);
    
    const movFinal = {
        ...nuevoMov,
        id_movimiento: Date.now(),
        // Si es efectivo o tipo inmediato, le ponemos fecha de confirmación hoy
        fecha_confirmacion: esInmediato ? new Date().toISOString().split('T')[0] : null
    };
    
    setMovimientos(prev => [...prev, movFinal]);
};

  const registrarCuenta = (nuevaCuenta) => {
    setCuentas((prev) => [...prev, { ...nuevaCuenta, id_cuenta: Date.now() }]);
  };

  const confirmarMovimientos = (movimientosSeleccionados) => {
    const hoy = new Date().toISOString().slice(0, 10);
    setMovimientos((prev) =>
      prev.map((mov) =>
        movimientosSeleccionados.includes(mov.id_movimiento)
          ? { ...mov, fecha_confirmacion: hoy }
          : mov,
      ),
    );
  };

  return {
    cuentas,
    movimientos,
    obtenerEstadoCuenta,
    registrarMovimiento,
    registrarCuenta,
    confirmarMovimientos,
    bancos: BANCOS,
  };
};