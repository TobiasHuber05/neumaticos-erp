/**
 * Script para crear las cuentas contables por defecto y los modelos de asiento iniciales.
 * Ejecutar: node server/seedModelosAsientos.js
 */
import { prisma } from './lib/prisma.js';

const CUENTAS_POR_DEFECTO = [
  { cuenta_contable: '1.1.01', nombre: 'Caja y Bancos', tipo_cuenta: 'Activo', asentable: true, nivel: 1 },
  { cuenta_contable: '1.1.02', nombre: 'Cuentas a Cobrar / Clientes', tipo_cuenta: 'Activo', asentable: true, nivel: 1 },
  { cuenta_contable: '2.1.05', nombre: 'IVA Débito Fiscal', tipo_cuenta: 'Pasivo', asentable: true, nivel: 1 },
  { cuenta_contable: '2.1.06', nombre: 'IVA Crédito Fiscal', tipo_cuenta: 'Pasivo', asentable: true, nivel: 1 },
  { cuenta_contable: '4.1.01', nombre: 'Ventas de Mercaderías', tipo_cuenta: 'Ingreso', asentable: true, nivel: 1 },
  { cuenta_contable: '4.1.02', nombre: 'Devolución sobre Ventas', tipo_cuenta: 'Ingreso', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-COMPRA-MERC', nombre: 'Mercaderías (Compras)', tipo_cuenta: 'Activo', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-COMPRA-IVA', nombre: 'IVA Crédito Fiscal (Compras)', tipo_cuenta: 'Pasivo', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-COMPRA-PROV', nombre: 'Proveedores Locales', tipo_cuenta: 'Pasivo', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-TES-OTROS-ING', nombre: 'Otros Ingresos Bancarios', tipo_cuenta: 'Ingreso', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-TES-INTERESES', nombre: 'Intereses Bancarios', tipo_cuenta: 'Ingreso', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-TES-GASTOS', nombre: 'Gastos Bancarios', tipo_cuenta: 'Gasto', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-NOM-SUELDOS', nombre: 'Sueldos y Jornales', tipo_cuenta: 'Gasto', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-NOM-BONIF', nombre: 'Bonificación Familiar', tipo_cuenta: 'Gasto', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-NOM-IPS', nombre: 'Aportes IPS a Pagar', tipo_cuenta: 'Pasivo', asentable: true, nivel: 1 },
  { cuenta_contable: 'SYS-NOM-CAJA', nombre: 'Caja y Banco (Pago Nómina)', tipo_cuenta: 'Activo', asentable: true, nivel: 1 },
];

const MODELOS_POR_DEFECTO = [
  {
    operacion_asiento: 'VENTA_FACTURA',
    descripcion: 'Factura de Venta',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Clientes por Ventas', cuenta_code: '1.1.02', debe_haber: true, iva: false, es_cuenta_bancaria: false },
      { item: 2, descripcion_final: 'Ventas de Mercaderías', cuenta_code: '4.1.01', debe_haber: false, iva: false, es_cuenta_bancaria: false },
      { item: 3, descripcion_final: 'IVA Débito Fiscal 10%', cuenta_code: '2.1.05', debe_haber: false, iva: true, es_cuenta_bancaria: false },
    ],
  },
  {
    operacion_asiento: 'VENTA_NOTA_CREDITO',
    descripcion: 'Nota de Crédito - Venta',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Devolución de Ventas', cuenta_code: '4.1.02', debe_haber: true, iva: false, es_cuenta_bancaria: false },
      { item: 2, descripcion_final: 'Reversión IVA Débito Fiscal', cuenta_code: '2.1.05', debe_haber: true, iva: true, es_cuenta_bancaria: false },
      { item: 3, descripcion_final: 'Aplicación Nota de Crédito a Cliente', cuenta_code: '1.1.02', debe_haber: false, iva: false, es_cuenta_bancaria: false },
    ],
  },
  {
    operacion_asiento: 'COMPRA_FACTURA',
    descripcion: 'Factura de Compra',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Mercaderías', cuenta_code: 'SYS-COMPRA-MERC', debe_haber: true, iva: false, es_cuenta_bancaria: false },
      { item: 2, descripcion_final: 'IVA Crédito Fiscal', cuenta_code: 'SYS-COMPRA-IVA', debe_haber: true, iva: true, es_cuenta_bancaria: false },
      { item: 3, descripcion_final: 'Proveedores Locales', cuenta_code: 'SYS-COMPRA-PROV', debe_haber: false, iva: false, es_cuenta_bancaria: false },
    ],
  },
  {
    operacion_asiento: 'COMPRA_NOTA_CREDITO',
    descripcion: 'Nota de Crédito - Compra',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Cancelación Deuda Proveedor', cuenta_code: 'SYS-COMPRA-PROV', debe_haber: true, iva: false, es_cuenta_bancaria: false },
      { item: 2, descripcion_final: 'Devolución de Mercaderías', cuenta_code: 'SYS-COMPRA-MERC', debe_haber: false, iva: false, es_cuenta_bancaria: false },
      { item: 3, descripcion_final: 'Reverso IVA Crédito Fiscal', cuenta_code: 'SYS-COMPRA-IVA', debe_haber: false, iva: true, es_cuenta_bancaria: false },
    ],
  },
  {
    operacion_asiento: 'COBRO_CLIENTE',
    descripcion: 'Cobro a Cliente',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Caja y Bancos (Ingreso por cobro)', cuenta_code: '1.1.01', debe_haber: true, iva: false, es_cuenta_bancaria: true },
      { item: 2, descripcion_final: 'Clientes por Ventas', cuenta_code: '1.1.02', debe_haber: false, iva: false, es_cuenta_bancaria: false },
    ],
  },
  {
    operacion_asiento: 'PAGO_PROVEEDOR',
    descripcion: 'Pago a Proveedor',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Cancelación Deuda Proveedor', cuenta_code: 'SYS-COMPRA-PROV', debe_haber: true, iva: false, es_cuenta_bancaria: false },
      { item: 2, descripcion_final: 'Caja y Bancos (Egreso)', cuenta_code: '1.1.01', debe_haber: false, iva: false, es_cuenta_bancaria: true },
    ],
  },
  {
    operacion_asiento: 'TESORERIA_DEPOSITO',
    descripcion: 'Depósito Bancario',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Bancos (Ingreso por depósito)', cuenta_code: '1.1.01', debe_haber: true, iva: false, es_cuenta_bancaria: true },
      { item: 2, descripcion_final: 'Otros Ingresos Bancarios', cuenta_code: 'SYS-TES-OTROS-ING', debe_haber: false, iva: false, es_cuenta_bancaria: false },
    ],
  },
  {
    operacion_asiento: 'TESORERIA_INTERESES',
    descripcion: 'Intereses Bancarios',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Bancos (Ingreso por intereses)', cuenta_code: '1.1.01', debe_haber: true, iva: false, es_cuenta_bancaria: true },
      { item: 2, descripcion_final: 'Intereses Bancarios', cuenta_code: 'SYS-TES-INTERESES', debe_haber: false, iva: false, es_cuenta_bancaria: false },
    ],
  },
  {
    operacion_asiento: 'TESORERIA_GASTO',
    descripcion: 'Gasto Bancario',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Gastos Bancarios', cuenta_code: 'SYS-TES-GASTOS', debe_haber: true, iva: false, es_cuenta_bancaria: false },
      { item: 2, descripcion_final: 'Bancos (Egreso por gasto)', cuenta_code: '1.1.01', debe_haber: false, iva: false, es_cuenta_bancaria: true },
    ],
  },
  {
    operacion_asiento: 'TESORERIA_CHEQUE_RECHAZADO',
    descripcion: 'Cheque Rechazado',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Otros Ingresos (Reverso por rechazo)', cuenta_code: 'SYS-TES-OTROS-ING', debe_haber: true, iva: false, es_cuenta_bancaria: false },
      { item: 2, descripcion_final: 'Bancos (Egreso por cheque rechazado)', cuenta_code: '1.1.01', debe_haber: false, iva: false, es_cuenta_bancaria: true },
    ],
  },
  {
    operacion_asiento: 'NOMINA_SUELDOS',
    descripcion: 'Nómina - Pago de Salarios',
    tipo_asiento: 'Automatico',
    lineas: [
      { item: 1, descripcion_final: 'Sueldos y Jornales', cuenta_code: 'SYS-NOM-SUELDOS', debe_haber: true, iva: false, es_cuenta_bancaria: false },
      { item: 2, descripcion_final: 'Bonificación Familiar', cuenta_code: 'SYS-NOM-BONIF', debe_haber: true, iva: false, es_cuenta_bancaria: false },
      { item: 3, descripcion_final: 'Aportes IPS a Pagar', cuenta_code: 'SYS-NOM-IPS', debe_haber: false, iva: false, es_cuenta_bancaria: false },
      { item: 4, descripcion_final: 'Caja y Banco (Pago Nómina)', cuenta_code: '1.1.01', debe_haber: false, iva: false, es_cuenta_bancaria: true },
    ],
  },
];

async function seed() {
  console.log('🌱 Sembrando cuentas contables por defecto...');

  const cuentasCreadas = {};

  for (const c of CUENTAS_POR_DEFECTO) {
    let cuenta = await prisma.plan_cuentas.findFirst({
      where: { cuenta_contable: c.cuenta_contable },
    });

    if (!cuenta) {
      cuenta = await prisma.plan_cuentas.create({
        data: {
          cuenta_contable: c.cuenta_contable,
          nombre: c.nombre,
          tipo_cuenta: c.tipo_cuenta,
          asentable: c.asentable,
          nivel: c.nivel,
        },
      });
      console.log(`  ✅ Cuenta creada: ${c.cuenta_contable} - ${c.nombre}`);
    } else {
      console.log(`  ↪️ Ya existe: ${c.cuenta_contable} - ${c.nombre}`);
    }

    cuentasCreadas[c.cuenta_contable] = cuenta.id_cuenta;
  }

  console.log('\n🌱 Sembrando modelos de asientos...');

  for (const m of MODELOS_POR_DEFECTO) {
    const existente = await prisma.modelo_asiento.findFirst({
      where: { operacion_asiento: m.operacion_asiento },
    });

    if (existente) {
      console.log(`  ↪️ Ya existe modelo: ${m.operacion_asiento} - ${m.descripcion}`);
      continue;
    }

    const modelo = await prisma.modelo_asiento.create({
      data: {
        operacion_asiento: m.operacion_asiento,
        descripcion: m.descripcion,
        tipo_asiento: m.tipo_asiento,
        detalle_modelo_asiento: {
          create: m.lineas.map((l) => ({
            item: l.item,
            descripcion_final: l.descripcion_final,
            id_cuenta: cuentasCreadas[l.cuenta_code] || null,
            debe_haber: l.debe_haber,
            iva: l.iva || false,
            es_cuenta_bancaria: l.es_cuenta_bancaria || false,
          })),
        },
      },
    });

    console.log(`  ✅ Modelo creado: ${m.operacion_asiento} - ${m.descripcion}`);
  }

  console.log('\n🎉 Seed completado!');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
