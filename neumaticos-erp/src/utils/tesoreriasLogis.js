export const calcularSaldosDeCuenta = (movimientos) => {
    let saldoReal = 0;
    let saldoDisponible = 0;
  
    movimientos.forEach((mov) => {
        const ingreso = Number(mov.monto_ingreso || 0);
        const egreso = Number(mov.monto_egreso || 0);
  
        // 1. El Saldo Real siempre se afecta (Enunciado: "afectará el saldo de la cuenta")
        saldoReal += (ingreso - egreso);
  
        // 2. Cálculo del Saldo Disponible (Regras del flujo)
        
        // Manejo de Egresos (Pagos)
        if (egreso > 0) {
            // Si es transferencia, afecta disponible de inmediato.
            // Si es cheque, SOLO afecta si ya fue conciliado (tiene fecha_confirmacion).
            if (mov.tipo_movimiento === 'Transferencia' || mov.fecha_confirmacion) {
                saldoDisponible -= egreso;
            }
        } 
        
        // Manejo de Ingresos (Depósitos)
        else if (ingreso > 0) {
            // Afecta disponible si ya está confirmado (pasaron 48hs o es efectivo/mismo banco)
            if (mov.fecha_confirmacion) {
                saldoDisponible += ingreso;
            }
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