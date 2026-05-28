export const calcularSaldosDeCuenta = (
  movimientos,
  saldoInicial = 0,
  saldoDisponibleInicial = 0,
) => {
  let saldoReal = Number(saldoInicial) || 0;
  let saldoDisponible = Number(saldoDisponibleInicial) || 0;

  movimientos.forEach((mov) => {
    const ingreso = Number(mov.monto_ingreso || 0);
    const egreso = Number(mov.monto_egreso || 0);

    saldoReal += ingreso - egreso;

    if (egreso > 0) {
      if (mov.fecha_confirmacion || mov.tipo_deposito === 'Transferencia') {
        saldoDisponible -= egreso;
      }
    } else if (ingreso > 0 && mov.fecha_confirmacion) {
      saldoDisponible += ingreso;
    }
  });

  return { saldoReal, saldoDisponible };
};
  
/**
* Valida si un movimiento debe ser confirmado automáticamente 
* (Efectivo o Cheque mismo banco) o esperar 48hs.
*/
export const debeConfirmarInmediatamente = (tipoDeposito) => {
    const inmediatos = ['Efectivo', 'Cheque Mismo Banco'];
    return inmediatos.includes(tipoDeposito);
};


/**
 * Filtra movimientos que aún no han sido conciliados para mostrarlos 
 * en la pantalla de conciliación bancaria.
 */
export const obtenerMovimientosPendientesConciliacion = (movimientos, detallesConciliados) => {
    const idsConciliados = detallesConciliados
        .filter(d => d.conciliado)
        .map(d => d.id_movimiento);
      
    return movimientos.filter(m => !idsConciliados.includes(m.id_movimiento));
};