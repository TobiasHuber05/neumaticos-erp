/** Categorías comerciales: producto y proveedor usan las mismas etiquetas. */
export const CATEGORIAS_PRODUCTO = [
  'Neumáticos Auto',
  'Neumáticos Camioneta',
  'Lubricantes',
  'Accesorios',
];

export const MEDIOS_PAGO_PROVEEDOR = [
  'Efectivo',
  'Cheque',
  'Transferencia bancaria',
  'Nota de crédito',
  'Otro',
];

export const proveedoresIniciales = [
  {
    id: 1,
    nombre: 'Neumáticos del Este',
    ruc: '80012345-0',
    categorias: ['Neumáticos Camioneta', 'Neumáticos Auto'],
    contacto: 'Juan Pérez',
    telefono: '0981-111222',
    direccion: 'Av. de los Próceres, 123',
  },
  {
    id: 2,
    nombre: 'Importadora Global S.A.',
    ruc: '80098765-1',
    categorias: ['Lubricantes', 'Neumáticos Auto', 'Accesorios'],
    contacto: 'María García',
    telefono: '0971-333444',
    direccion: 'Calle de la Paz, 456',
  },
  {
    id: 3,
    nombre: 'Distribuidora Pirelli',
    ruc: '80055443-2',
    categorias: ['Neumáticos Auto', 'Neumáticos Camioneta'],
    contacto: 'Carlos Ruiz',
    telefono: '0961-555666',
    direccion: 'Av. de la Libertad, 789',
  },
  {
    id: 4,
    nombre: 'Repuestos Centro S.A.',
    ruc: '80011111-9',
    categorias: ['Accesorios', 'Lubricantes', 'Neumáticos Auto'],
    contacto: 'Ana López',
    telefono: '0991-777888',
    direccion: 'Ruta 2, km 10',
  },
];

export const inventarioInicial = [
  {
    id: 1,
    nombre: 'Michelin Primacy 4',
    categoria: 'Neumáticos Auto',
    stock: 5,
    min: 10,
    proveedor: 'Neumáticos del Este',
    precio: '1200000',
  },
  {
    id: 2,
    nombre: 'Pirelli Scorpion AT',
    categoria: 'Neumáticos Camioneta',
    stock: 15,
    min: 8,
    proveedor: 'Distribuidora Pirelli',
    precio: '1850000',
  },
  {
    id: 3,
    nombre: 'Bridgestone Turanza',
    categoria: 'Neumáticos Auto',
    stock: 3,
    min: 10,
    precio: '950000',
  },
  {
    id: 4,
    nombre: 'Fate Max Senti',
    categoria: 'Neumáticos Auto',
    stock: 25,
    min: 15,
    precio: '600000',
  },
];
