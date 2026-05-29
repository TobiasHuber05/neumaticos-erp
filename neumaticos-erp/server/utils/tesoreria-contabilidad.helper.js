const TIPOS_CONTABLES = {
  deposito: {
    descripcion: (m) => `Depósito bancario — ${m.concepto}`,
    detalles: (m) => {
      const monto = Number(m.monto_ingreso ?? 0);
      return [
        {
          cuenta_codigo: '1.1.01',
          monto,
          debe_haber: true,
          glosa: 'Bancos (Ingreso por depósito)',
        },
        {
          cuenta_codigo: 'SYS-TES-OTROS-ING',
          monto,
          debe_haber: false,
          glosa: 'Otros ingresos bancarios',
        },
      ];
    },
  },
  intereses: {
    descripcion: (m) => `Intereses bancarios — ${m.concepto}`,
    detalles: (m) => {
      const monto = Number(m.monto_ingreso ?? 0);
      return [
        {
          cuenta_codigo: '1.1.01',
          monto,
          debe_haber: true,
          glosa: 'Bancos (Ingreso por intereses)',
        },
        {
          cuenta_codigo: 'SYS-TES-INTERESES',
          monto,
          debe_haber: false,
          glosa: 'Intereses bancarios',
        },
      ];
    },
  },
  gasto_bancario: {
    descripcion: (m) => `Gasto bancario — ${m.concepto}`,
    detalles: (m) => {
      const monto = Number(m.monto_egreso ?? 0);
      return [
        {
          cuenta_codigo: 'SYS-TES-GASTOS',
          monto,
          debe_haber: true,
          glosa: 'Gastos bancarios (Chequera, comisiones, multas)',
        },
        {
          cuenta_codigo: '1.1.01',
          monto,
          debe_haber: false,
          glosa: 'Bancos (Egreso por gasto bancario)',
        },
      ];
    },
  },
  cheque_rechazado: {
    descripcion: (m) => `Cheque rechazado — ${m.concepto}`,
    detalles: (m) => {
      const monto = Number(m.monto_egreso ?? 0);
      return [
        {
          cuenta_codigo: 'SYS-TES-OTROS-ING',
          monto,
          debe_haber: true,
          glosa: 'Otros ingresos (Reverso por rechazo)',
        },
        {
          cuenta_codigo: '1.1.01',
          monto,
          debe_haber: false,
          glosa: 'Bancos (Egreso por cheque rechazado)',
        },
      ];
    },
  },
};

export const generarAsientoMovimientoManual = (movimiento) => {
  const tipo = TIPOS_CONTABLES[movimiento.tipo_contable];
  if (!tipo) return null;

  return {
    fecha: new Date(),
    descripcion: tipo.descripcion(movimiento),
    tabla_origen: 'movimiento_bancario',
    id_registro_origen: movimiento.id_movimiento,
    detalles: tipo.detalles(movimiento),
  };
};

export const TIPOS_CONTABLES_LIST = Object.keys(TIPOS_CONTABLES);
