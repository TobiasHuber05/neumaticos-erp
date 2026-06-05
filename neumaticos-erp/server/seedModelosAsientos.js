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

  console.log('\n🌱 Sembrando monedas...');
  const MONEDAS = ['Guaraní', 'Dólar', 'Euro'];
  for (const n of MONEDAS) {
    const existe = await prisma.monedas.findFirst({ where: { nombre: n } });
    if (!existe) {
      await prisma.monedas.create({ data: { nombre: n } });
      console.log(`  ✅ Moneda creada: ${n}`);
    } else {
      console.log(`  ↪️ Ya existe moneda: ${n}`);
    }
  }

  console.log('\n🌱 Sembrando formas de pago...');
  const FORMAS_PAGO = [
    { metodo_pago: 'Contado', tipo_metodo: 'contado' },
    { metodo_pago: 'Crédito', tipo_metodo: 'credito' },
    { metodo_pago: 'Cheque', tipo_metodo: 'cheque' },
    { metodo_pago: 'Transferencia', tipo_metodo: 'transferencia' },
  ];
  for (const f of FORMAS_PAGO) {
    const existe = await prisma.forma_pago.findFirst({ where: { metodo_pago: f.metodo_pago } });
    if (!existe) {
      await prisma.forma_pago.create({ data: f });
      console.log(`  ✅ Forma de pago creada: ${f.metodo_pago}`);
    } else {
      console.log(`  ↪️ Ya existe forma de pago: ${f.metodo_pago}`);
    }
  }

  console.log('\n🌱 Sembrando bancos...');
  const BANCOS = [
    { nombre: 'Itaú', codigo: 'ITA' },
    { nombre: 'BNF', codigo: 'BNF' },
    { nombre: 'Continental', codigo: 'CON' },
    { nombre: 'Regional', codigo: 'REG' },
    { nombre: 'Visión', codigo: 'VIS' },
    { nombre: 'GNB', codigo: 'GNB' },
  ];
  for (const b of BANCOS) {
    const existe = await prisma.banco.findFirst({ where: { codigo: b.codigo } });
    if (!existe) {
      await prisma.banco.create({ data: b });
      console.log(`  ✅ Banco creado: ${b.nombre}`);
    } else {
      console.log(`  ↪️ Ya existe banco: ${b.nombre}`);
    }
  }

  console.log('\n🌱 Sembrando categorías...');
  const CATEGORIAS = ['Neumáticos Auto', 'Neumáticos Camioneta', 'Lubricantes', 'Accesorios'];
  for (const n of CATEGORIAS) {
    const existe = await prisma.categoria.findFirst({ where: { nombre: n } });
    if (!existe) {
      await prisma.categoria.create({ data: { nombre: n } });
      console.log(`  ✅ Categoría creada: ${n}`);
    } else {
      console.log(`  ↪️ Ya existe categoría: ${n}`);
    }
  }

  console.log('\n🌱 Sembrando marcas...');
  const MARCAS = ['Michelin', 'Pirelli', 'Bridgestone', 'Continental', 'Goodyear'];
  for (const n of MARCAS) {
    const existe = await prisma.marcas.findFirst({ where: { nombre: n } });
    if (!existe) {
      await prisma.marcas.create({ data: { nombre: n } });
      console.log(`  ✅ Marca creada: ${n}`);
    } else {
      console.log(`  ↪️ Ya existe marca: ${n}`);
    }
  }

  console.log('\n🌱 Sembrando categorías de proveedores...');
  const CATS_PROVEEDORES = [
    { tipo: 'Distribuidor', descripcion: 'Distribuye productos a_minoristas' },
    { tipo: 'Mayorista', descripcion: 'Venta al por mayor' },
    { tipo: 'Importador', descripcion: 'Importa productos del exterior' },
    { tipo: 'Fabricante', descripcion: 'Fabrica los productos que vende' },
  ];
  for (const c of CATS_PROVEEDORES) {
    const existe = await prisma.categorias_proveedores.findFirst({ where: { tipo: c.tipo } });
    if (!existe) {
      await prisma.categorias_proveedores.create({ data: c });
      console.log(`  ✅ Categoría proveedor creada: ${c.tipo}`);
    } else {
      console.log(`  ↪️ Ya existe categoría proveedor: ${c.tipo}`);
    }
  }

  console.log('\n🌱 Sembrando periodo contable...');
  const periodoExiste = await prisma.proceso_contable.findFirst({ where: { periodo_anho: '2026' } });
  if (!periodoExiste) {
    await prisma.proceso_contable.create({
      data: {
        periodo_anho: '2026',
        descripcion: 'Periodo 2026',
        cant_niveles: 1,
        cant_dig_nivel: 2,
        moneda: 'Guaraní',
        estado: 'Abierto',
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
      },
    });
    console.log('  ✅ Periodo contable creado: 2026');
  } else {
    console.log('  ↪️ Ya existe periodo contable: 2026');
  }

  console.log('\n🌱 Sembrando timbrado...');
  const timbradoExiste = await prisma.Timbrado.findFirst({ where: { nro_timbrado: '12345678' } });
  if (!timbradoExiste) {
    await prisma.Timbrado.create({
      data: {
        nro_timbrado: '12345678',
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
        rango_desde: 1,
        rango_hasta: 1000,
        tipo_documento: 'FACTURA',
        estado: true,
      },
    });
    console.log('  ✅ Timbrado creado: 12345678');
  } else {
    console.log('  ↪️ Ya existe timbrado: 12345678');
  }

  console.log('\n🌱 Sembrando clientes...');
  const CLIENTES = [
    { nombre: 'Juan', apellido: 'Pérez', ruc: '12345678-0', direccion: 'Asunción' },
    { nombre: 'María', apellido: 'González', ruc: '87654321-0', direccion: 'Encarnación' },
  ];
  for (const c of CLIENTES) {
    const existe = await prisma.cliente.findFirst({ where: { ruc: c.ruc } });
    if (!existe) {
      await prisma.cliente.create({ data: c });
      console.log(`  ✅ Cliente creado: ${c.nombre} ${c.apellido}`);
    } else {
      console.log(`  ↪️ Ya existe cliente: ${c.nombre} ${c.apellido}`);
    }
  }

  console.log('\n🌱 Sembrando proveedores...');
  const PROVEEDORES = [
    { nombre: 'Distribuidora ABC', ruc: '11111111-1', direccion: 'Asunción', telefono: '021111111' },
    { nombre: 'Importadora XYZ', ruc: '22222222-2', direccion: 'Lambaré', telefono: '021222222' },
    { nombre: 'Mayorista 123', ruc: '33333333-3', direccion: 'San Lorenzo', telefono: '021333333' },
  ];
  for (const p of PROVEEDORES) {
    const existe = await prisma.proveedores.findFirst({ where: { ruc: p.ruc } });
    if (!existe) {
      await prisma.proveedores.create({ data: p });
      console.log(`  ✅ Proveedor creado: ${p.nombre}`);
    } else {
      console.log(`  ↪️ Ya existe proveedor: ${p.nombre}`);
    }
  }

  console.log('\n🌱 Sembrando productos...');
  const catNeumaticos = await prisma.categoria.findFirst({ where: { nombre: 'Neumáticos Auto' } });
  const marcaPirelli = await prisma.marcas.findFirst({ where: { nombre: 'Pirelli' } });

  const PRODUCTOS = [
    { codigo: 'N001', descripcion: 'Neumático 205/55 R16', id_categoria: catNeumaticos?.id_categoria, id_marca: marcaPirelli?.id_marca, es_servicio: false },
    { codigo: 'N002', descripcion: 'Neumático 195/65 R15', id_categoria: catNeumaticos?.id_categoria, id_marca: marcaPirelli?.id_marca, es_servicio: false },
    { codigo: 'ACE01', descripcion: 'Aceite Motor 20W50', es_servicio: false },
  ];
  for (const p of PRODUCTOS) {
    const existe = await prisma.producto.findFirst({ where: { codigo: p.codigo } });
    if (!existe) {
      const created = await prisma.producto.create({ data: p });
      // Crear stock inicial en 0
      await prisma.stock.create({
        data: { id_producto: created.id_producto, cantidad: 0 },
      });
      console.log(`  ✅ Producto creado: ${p.codigo} - ${p.descripcion}`);
    } else {
      console.log(`  ↪️ Ya existe producto: ${p.codigo}`);
    }
  }

  const CARGOS_POR_DEFECTO = [
    { nombre_cargo: 'Gerente General',     descripcion_cargo: 'Todos los módulos con edición.',           area_superior: 'Dirección',      jefe_inmediato: null },
    { nombre_cargo: 'Jefe de Compras',     descripcion_cargo: 'Compras y Stock (edición).',               area_superior: 'Compras',        jefe_inmediato: 'Gerente General' },
    { nombre_cargo: 'Encargado de Compras',descripcion_cargo: 'Compras y Stock (edición).',               area_superior: 'Compras',        jefe_inmediato: 'Jefe de Compras' },
    { nombre_cargo: 'Jefe de Ventas',      descripcion_cargo: 'Ventas y Stock (edición).',                area_superior: 'Ventas',         jefe_inmediato: 'Gerente General' },
    { nombre_cargo: 'Vendedor',            descripcion_cargo: 'Ventas y Stock (edición).',                area_superior: 'Ventas',         jefe_inmediato: 'Jefe de Ventas' },
    { nombre_cargo: 'Contador',            descripcion_cargo: 'Todo solo lectura; Contabilidad edición.', area_superior: 'Contabilidad',   jefe_inmediato: 'Gerente General' },
    { nombre_cargo: 'Tesorero',            descripcion_cargo: 'Tesorería (edición).',                     area_superior: 'Tesorería',      jefe_inmediato: 'Gerente General' },
    { nombre_cargo: 'Jefe RRHH',           descripcion_cargo: 'Funcionarios / Personal (edición).',       area_superior: 'Recursos Humanos', jefe_inmediato: 'Gerente General' },
    { nombre_cargo: 'Encargado Depósito',  descripcion_cargo: 'Stock (edición).',                         area_superior: 'Logística',      jefe_inmediato: 'Gerente General' },
  ];

  for (const c of CARGOS_POR_DEFECTO) {
    const existe = await prisma.cargos.findFirst({
      where: { nombre_cargo: c.nombre_cargo },
    });
    if (!existe) {
      await prisma.cargos.create({ data: c });
      console.log(`  ✅ Cargo creado: ${c.nombre_cargo}`);
    } else {
      console.log(`  ↪️ Ya existe cargo: ${c.nombre_cargo}`);
    }
  }

  console.log('\n🎉 Seed completado!');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
