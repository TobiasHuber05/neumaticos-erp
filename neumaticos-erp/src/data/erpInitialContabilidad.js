// src/data/erpInitialContabilidad.js - Datos iniciales para el módulo de Contabilidad

export const planDeCuentasInicial = [
  { id: 1, codigo: '1', nombre: 'ACTIVO', tipo: 'Totalizadora', nivel: 1 },
  { id: 2, codigo: '1.1', nombre: 'ACTIVO CORRIENTE', tipo: 'Totalizadora', nivel: 2, padreId: 1 },
  { id: 3, codigo: '1.1.01', nombre: 'Caja y Bancos', tipo: 'Totalizadora', nivel: 3, padreId: 2 },
  { id: 4, codigo: '1.1.01.01', nombre: 'Caja Central', tipo: 'Asentable', nivel: 4, padreId: 3 },
  { id: 5, codigo: '1.1.01.02', nombre: 'Banco Itau Cta Cte', tipo: 'Asentable', nivel: 4, padreId: 3 },
  { id: 6, codigo: '1.1.02', nombre: 'Cuentas a Cobrar', tipo: 'Asentable', nivel: 3, padreId: 2 },
  { id: 7, codigo: '2', nombre: 'PASIVO', tipo: 'Totalizadora', nivel: 1 },
  { id: 8, codigo: '2.1', nombre: 'PASIVO CORRIENTE', tipo: 'Totalizadora', nivel: 2, padreId: 7 },
  { id: 9, codigo: '2.1.01', nombre: 'Proveedores Locales', tipo: 'Asentable', nivel: 3, padreId: 8 },
  { id: 10, codigo: '4', nombre: 'INGRESOS', tipo: 'Totalizadora', nivel: 1 },
  { id: 11, codigo: '4.1', nombre: 'INGRESOS OPERATIVOS', tipo: 'Totalizadora', nivel: 2, padreId: 10 },
  { id: 12, codigo: '4.1.01', nombre: 'Ventas de Neumáticos', tipo: 'Asentable', nivel: 3, padreId: 11 },
  { id: 13, codigo: '5', nombre: 'EGRESOS', tipo: 'Totalizadora', nivel: 1 },
  { id: 14, codigo: '5.1', nombre: 'EGRESOS OPERATIVOS', tipo: 'Totalizadora', nivel: 2, padreId: 13 },
  { id: 15, codigo: '5.1.01', nombre: 'Costo de Mercaderías Vendidas', tipo: 'Asentable', nivel: 3, padreId: 14 },
];




export const asientosContablesIniciales = [
  {
    id: 1,
    fecha: '2026-04-10',
    descripcion: 'Apertura de Caja Inicial',
    numero: 'AS-2026-001',
    estado: 'Borrador',
    lineas: [
      { id: 1, cuentaId: 4, debe: 5000000, haber: 0, glosa: 'Ingreso efectivo inicial' },
      { id: 2, cuentaId: 5, debe: 0, haber: 5000000, glosa: 'Aporte de capital' },
    ],
    totalDebe: 5000000,
    totalHaber: 5000000,
  },
  {
    id: 2,
    fecha: '2026-04-15',
    descripcion: 'Venta de Neumáticos Contado',
    numero: 'AS-2026-002',
    estado: 'Asentado',
    lineas: [
      { id: 3, cuentaId: 4, debe: 1200000, haber: 0, glosa: 'Cobro venta FAC-001' },
      { id: 4, cuentaId: 12, debe: 0, haber: 1200000, glosa: 'Venta mercaderías' },
    ],
    totalDebe: 1200000,
    totalHaber: 1200000,
  }
];

export const periodosContablesIniciales = [
  { id: 1, nombre: 'Ejercicio 2026', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', estado: 'Abierto' },
  { id: 2, nombre: 'Ejercicio 2025', fechaInicio: '2025-01-01', fechaFin: '2025-12-31', estado: 'Cerrado' },
];

export default {
  planDeCuentasInicial,
  asientosContablesIniciales,
  periodosContablesIniciales,
};
