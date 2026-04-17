// src/data/erpInitialPersonal.js - Datos iniciales para el módulo de Gestión de Personas y Salarios

export const funcionariosIniciales = [
  {
    id: 1,
    nombre: 'Juan Perez',
    documento: '1.234.567',
    fechaIngreso: '2020-01-15',
    salarioBase: 3500000,
    cargoActual: 'Mecánico Senior',
    nucleoFamiliar: [
      { nombre: 'Juanito Perez', parentesco: 'Hijo', fechaNacimiento: '2015-05-20' }, // Menor de 18
      { nombre: 'Maria Perez', parentesco: 'Hija', fechaNacimiento: '2022-10-10' }, // Menor de 18
    ],
    historialCargos: [
      { cargo: 'Ayudante Mecánico', fecha: '2020-01-15' },
      { cargo: 'Mecánico Senior', fecha: '2022-06-01' },
    ],
    estado: 'Activo',
  },
  {
    id: 2,
    nombre: 'Ana Rodriguez',
    documento: '2.345.678',
    fechaIngreso: '2021-03-01',
    salarioBase: 2800000,
    cargoActual: 'Administrativa',
    nucleoFamiliar: [
      { nombre: 'Lucas Rodriguez', parentesco: 'Hijo', fechaNacimiento: '2005-01-10' }, // Mayor de 18 (para 2026)
    ],
    historialCargos: [
      { cargo: 'Administrativa', fecha: '2021-03-01' },
    ],
    estado: 'Activo',
  },
];

export const conceptosSalarialesIniciales = [
  { id: 1, nombre: 'Salario Base', tipo: 'Ingreso', esIPS: true, automatico: true },
  { id: 2, nombre: 'Horas Extras 50%', tipo: 'Ingreso', esIPS: true, automatico: false },
  { id: 3, nombre: 'Horas Extras 100%', tipo: 'Ingreso', esIPS: true, automatico: false },
  { id: 4, nombre: 'Bonificación Familiar', tipo: 'Ingreso', esIPS: false, automatico: true },
  { id: 5, nombre: 'Anticipo de Salario', tipo: 'Egreso', esIPS: false, automatico: false },
  { id: 6, nombre: 'IPS Obrero (9%)', tipo: 'Egreso', esIPS: false, automatico: true },
];

export const configuracionNominaInicial = {
  salarioMinimo: 2680373, // Salario mínimo legal vigente (PY)
  porcentajeIPS: 9,
  porcentajeBonificacion: 5,
};

export const procesosPagoIniciales = [
  {
    id: 1,
    periodo: '2026-03',
    fechaPago: '2026-03-31',
    estado: 'Cerrado', // Abierto, Cerrado
    liquidaciones: [
      {
        funcionarioId: 1,
        conceptos: [
          { conceptoId: 1, monto: 3500000 },
          { conceptoId: 4, monto: 268037 }, // 5% * 2 * 2680373 ?? No, 5% * salarioMinimo per child
          { conceptoId: 6, monto: 315000 }, // 9% of 3500000
        ],
        totalIngresos: 3768037,
        totalEgresos: 315000,
        neto: 3453037,
      }
    ],
  }
];

export const asientosNominaIniciales = [
  {
    id: 'ASNP-001',
    fecha: '2026-03-31',
    descripcion: 'Pago de Salarios - Periodo 2026-03',
    detalles: [
      { cuenta: 'Sueldos y Jornales', debe: 3500000, haber: 0 },
      { cuenta: 'Aportes y Retenciones a Pagar', debe: 0, haber: 315000 },
      { cuenta: 'Caja/Banco', debe: 0, haber: 3185000 },
    ]
  }
];

export default {
    funcionariosIniciales,
    conceptosSalarialesIniciales,
    configuracionNominaInicial,
    procesosPagoIniciales,
    asientosNominaIniciales
};
