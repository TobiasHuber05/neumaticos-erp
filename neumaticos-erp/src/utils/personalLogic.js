// src/utils/personalLogic.js - Lógica de cálculos para RRHH y Nómina

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
export const calcularEdad = (fechaNacimiento) => {
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--;
  }
  return edad;
};

/**
 * Calcula el monto de bonificación familiar (5% del salario mínimo por cada hijo < 18 años)
 */
export const calcularBonificacionFamiliar = (funcionario, config) => {
  const hijosMenores = funcionario.nucleoFamiliar.filter(
    (miembro) => miembro.parentesco === 'Hijo' && calcularEdad(miembro.fechaNacimiento) < 18
  ).length;

  return hijosMenores * (config.salarioMinimo * (config.porcentajeBonificacion / 100));
};

/**
 * Calcula el aporte IPS (9% sobre ingresos deducibles)
 */
export const calcularIPS = (ingresos, config) => {
  // ingresos es un array de { conceptoId, monto, esIPS }
  const totalDeducible = ingresos
    .filter((i) => i.esIPS)
    .reduce((sum, i) => sum + i.monto, 0);

  return Math.round(totalDeducible * (config.porcentajeIPS / 100));
};

/**
 * Genera la liquidación detallada para un funcionario en un proceso de pago
 */
export const generarLiquidacionFuncionario = (funcionario, conceptos, config, ingresosExtras = [], egresosExtras = []) => {
  const lineas = [];

  // 1. Salario Base (Automático)
  lineas.push({
    conceptoId: 1,
    nombre: 'Salario Base',
    tipo: 'Ingreso',
    monto: funcionario.salarioBase,
    esIPS: true
  });

  // 2. Bonificación Familiar (Automático si aplica)
  const bonif = calcularBonificacionFamiliar(funcionario, config);
  if (bonif > 0) {
    lineas.push({
      conceptoId: 4,
      nombre: 'Bonificación Familiar',
      tipo: 'Ingreso',
      monto: bonif,
      esIPS: false
    });
  }

  // 3. Ingresos Extras (Horas extras, premios, etc)
  ingresosExtras.forEach(ie => {
      const c = conceptos.find(x => x.id === ie.conceptoId);
      lineas.push({
          conceptoId: ie.conceptoId,
          nombre: c.nombre,
          tipo: 'Ingreso',
          monto: ie.monto,
          esIPS: c.esIPS
      });
  });

  // 4. Calcular IPS sobre lo acumulado hasta ahora
  const ipsMonto = calcularIPS(lineas, config);
  lineas.push({
    conceptoId: 6,
    nombre: 'IPS Obrero (9%)',
    tipo: 'Egreso',
    monto: ipsMonto,
    esIPS: false
  });

  // 5. Egresos Extras (Anticipos, prestamos, etc)
  egresosExtras.forEach(ee => {
    const c = conceptos.find(x => x.id === ee.conceptoId);
    lineas.push({
        conceptoId: ee.conceptoId,
        nombre: c.nombre,
        tipo: 'Egreso',
        monto: ee.monto,
        esIPS: false
    });
  });

  const totalIngresos = lineas.filter(l => l.tipo === 'Ingreso').reduce((s, l) => s + l.monto, 0);
  const totalEgresos = lineas.filter(l => l.tipo === 'Egreso').reduce((s, l) => s + l.monto, 0);

  return {
    funcionarioId: funcionario.id,
    funcionarioNombre: funcionario.nombre,
    lineas,
    totalIngresos,
    totalEgresos,
    neto: totalIngresos - totalEgresos
  };
};

/**
 * Genera el asiento contable para un proceso de pago cerrado
 */
export const generarAsientoNomina = (proceso, alias = 'AC-PERS') => {
  const totalSueldos = proceso.liquidaciones.reduce((sum, liq) => {
      const sb = liq.lineas.find(l => l.conceptoId === 1);
      return sum + (sb ? sb.monto : 0);
  }, 0);

  const totalBonif = proceso.liquidaciones.reduce((sum, liq) => {
    const bn = liq.lineas.find(l => l.conceptoId === 4);
    return sum + (bn ? bn.monto : 0);
  }, 0);

  const totalIPS = proceso.liquidaciones.reduce((sum, liq) => {
    const ip = liq.lineas.find(l => l.conceptoId === 6);
    return sum + (ip ? ip.monto : 0);
  }, 0);

  const totalNeto = proceso.liquidaciones.reduce((sum, liq) => sum + liq.neto, 0);

  return {
    id: `${alias}-${Date.now()}`,
    fecha: proceso.fechaPago,
    descripcion: `Nómina de Salarios - Periodo ${proceso.periodo}`,
    detalles: [
      { cuenta: 'Sueldos y Jornales', debe: totalSueldos, haber: 0 },
      { cuenta: 'Bonificación Familiar', debe: totalBonif, haber: 0 },
      { cuenta: 'Aportes y Retenciones a Pagar (IPS)', debe: 0, haber: totalIPS },
      { cuenta: 'Caja y BANCO', debe: 0, haber: totalNeto },
    ]
  };
};

export const formatGua = (monto) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(monto);
};
