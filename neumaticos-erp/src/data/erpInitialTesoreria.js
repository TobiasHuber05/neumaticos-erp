// src/data/tesoreriaInitialData.js

export const MONEDAS = [
    { id_moneda: 1, nombre: 'Guaraníes', simbolo: 'Gs.' },
    { id_moneda: 2, nombre: 'Dólares', simbolo: 'US$' },
  ];
  
  export const BANCOS = [
    { id_banco: 1, nombre: 'Banco Itaú Paraguay', codigo: 'ITAU' },
    { id_banco: 2, nombre: 'Banco Nacional de Fomento', codigo: 'BNF' },
  ];
  
  export const CUENTAS_BANCARIAS = [
    {
      id_cuenta: 101,
      id_banco: 1,
      id_moneda: 1,
      numero_cuenta: '1234567-0',
      tipo_cuenta: 'Cuenta Corriente',
      saldo: 15000000,           // Saldo Real según tu DER
      saldo_disponible: 12000000 // Saldo descontando pendientes
    },
    {
      id_cuenta: 102,
      id_banco: 2,
      id_moneda: 1,
      numero_cuenta: '987654-2',
      tipo_cuenta: 'Caja de Ahorro',
      saldo: 5000000,
      saldo_disponible: 5000000
    }
  ];
  
  export const MOVIMIENTOS_BANCARIOS = [
    {
      id_movimiento: 5001,
      id_cuenta: 101,
      monto_ingreso: 0,
      monto_egreso: 55000,
      fecha_movimiento: '2026-04-10',
      fecha_confirmacion: '2026-04-10', // Confirmado el mismo día
      tipo_movimiento: 'Débito',
      concepto: 'Gasto de Chequera'
    },
    {
      id_movimiento: 5002,
      id_cuenta: 101,
      monto_ingreso: 3000000,
      monto_egreso: 0,
      fecha_movimiento: '2026-04-11',
      fecha_confirmacion: null, // Pendiente (48hs) - No suma al disponible todavía
      tipo_movimiento: 'Crédito',
      concepto: 'Depósito Cheque Otros Bancos'
    }
  ];
  
  // Datos para la conciliación (según tus tablas de ConciliacionBancaria y Detalle)
  export const CONCILIACIONES = [
    {
      id_conciliacion: 1,
      id_cuenta: 101,
      fecha: '2026-03-31',
      descripcion: 'Conciliación de Marzo'
    }
  ];
  
  export const DETALLE_CONCILIACION = [
    {
      id_detalle: 1,
      id_conciliacion: 1,
      id_movimiento: 5001,
      conciliado: true
    }
  ];