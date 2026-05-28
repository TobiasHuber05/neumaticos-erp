export const MEDIOS_BANCARIOS = ['Transferencia bancaria', 'Cheque'];

export const esMedioBancario = (medio) => MEDIOS_BANCARIOS.includes(medio);

/** Movimiento de egreso — pagos a proveedores */
export const datosMovimientoPagoProveedor = (medio, monto, fecha, referencia) => {
  const esCheque = medio.toLowerCase().includes('cheque');
  const esTransferencia = medio.toLowerCase().includes('transferencia');

  return {
    monto_ingreso: 0,
    monto_egreso: monto,
    tipo_movimiento: 'Débito',
    concepto: referencia,
    tipo_deposito: esCheque ? 'Cheque Propio' : 'Transferencia',
    fecha_confirmacion: esTransferencia ? (fecha ? new Date(fecha) : new Date()) : null,
  };
};

/** Movimiento de ingreso — cobros de clientes */
export const datosMovimientoCobroCliente = (medio, monto, fecha, referencia) => {
  const esCheque = medio.toLowerCase().includes('cheque');
  const esTransferencia = medio.toLowerCase().includes('transferencia');
  const esEfectivo = medio === 'Efectivo';

  let tipoDeposito = 'Efectivo';
  if (esCheque) tipoDeposito = 'Cheque Otros Bancos';
  else if (esTransferencia) tipoDeposito = 'Transferencia';

  const confirmaInmediato = esTransferencia || esEfectivo;

  return {
    monto_ingreso: monto,
    monto_egreso: 0,
    tipo_movimiento: 'Crédito',
    concepto: referencia,
    tipo_deposito: tipoDeposito,
    fecha_confirmacion: confirmaInmediato ? (fecha ? new Date(fecha) : new Date()) : null,
  };
};

export const estadoDetalleCobro = (medio) => {
  if (medio.toLowerCase().includes('cheque')) return 'Emitido';
  return 'Confirmado';
};
