// src/data/erpInitialVentas.js - Datos iniciales para módulo Ventas y Facturación

// Clientes: nombre, apellido, documento/RUC, fechaNacimiento, email
export const clientesIniciales = [
  {
    id: 1,
    nombre: 'Juan Carlos',
    apellido: 'González López',
    documento: '4.567.890-1',
    fechaNacimiento: '1985-03-15',
    email: 'juan.gonzalez@transporte.com.py',
  },
  {
    id: 2,
    nombre: 'María Elena',
    apellido: 'Vázquez',
    documento: '80012345-0', // RUC empresa
    fechaNacimiento: '1990-07-22',
    email: 'maria@flotaexpress.com.py',
  },
  {
    id: 3,
    nombre: 'Pedro Antonio',
    apellido: 'Silva',
    documento: '3.214.567-8',
    fechaNacimiento: '1978-11-10',
    email: 'pedro.silva@gmail.com',
  },
];

// Presupuestos: vigentes 10 días hábiles (~14 calendario), lineas con productos del inventario
export const presupuestosIniciales = [
  {
    id: 1,
    numero: 'PRES-001',
    clientId: 1,
    fechaCreacion: '2026-04-01',
    fechaExpiracion: '2026-04-15', // +10 días hábiles
    lineas: [
      { productoId: 1, cantidad: 4, precioUnitario: 1200000, totalLinea: 4800000 },
      { productoId: 2, cantidad: 2, precioUnitario: 1850000, totalLinea: 3700000 },
    ],
    total: 8500000,
    estado: 'Vigente', // Vigente, Expirado, Convertido
  },
  {
    id: 2,
    numero: 'PRES-002',
    clientId: 2,
    fechaCreacion: '2026-03-25',
    fechaExpiracion: '2026-04-08',
    lineas: [{ productoId: 4, cantidad: 6, precioUnitario: 600000, totalLinea: 3600000 }],
    total: 3600000,
    estado: 'Vigente',
  },
  {
    id: 3,
    numero: 'PRES-003',
    clientId: 3,
    fechaCreacion: '2026-03-20',
    fechaExpiracion: '2026-04-03', // Expirado para demo
    lineas: [{ productoId: 3, cantidad: 3, precioUnitario: 950000, totalLinea: 2850000 }],
    total: 2850000,
    estado: 'Expirado',
  },
];

// Facturas de venta: generadas desde presupuesto, stock descontado
export const facturasVentasIniciales = [
  {
    id: 1,
    numero: 'FACV-001',
    presupuestoId: null, // Será PRES-001 al crear
    clientId: 1,
    fechaFactura: '2026-04-10',
    lineas: [
      { productoId: 1, cantidad: 4, precioUnitario: 1200000, totalLinea: 4800000 },
    ],
    total: 4800000,
    estado: 'Emitida', // Emitida, Cobrada, Anulada
    fecha48h: '2026-04-12', // Para devoluciones
  },
];

// Notas de crédito ventas: devoluciones <48h, stock repuesto
export const notasCreditoVentasIniciales = [];

// Asientos contables ventas: auto-generados
export const asientosVentasIniciales = [
  {
    id: 1,
    tipo: 'Factura Emitida',
    facturaId: 1,
    fecha: '2026-04-10',
    descripcion: 'FACV-001 Juan Carlos González - Michelin Primacy 4 x4',
    debe: 0,
    haber: 4800000,
    cuenta: 'Ventas Neumáticos',
  },
];

export default {
  clientesIniciales,
  presupuestosIniciales,
  facturasVentasIniciales,
  notasCreditoVentasIniciales,
  asientosVentasIniciales,
};

