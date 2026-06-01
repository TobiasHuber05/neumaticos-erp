import { prisma } from '../../lib/prisma.js';

const SALARIO_MINIMO = 2680373; // Guaraníes 2025 — ajustar según corresponda
const PORCENTAJE_IPS = 0.09;
const PORCENTAJE_BONIF_FAMILIAR = 0.05;

// Calcula la edad en años
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// ─── CONCEPTOS ──────────────────────────────────────────────────

// GET /api/salarios/conceptos  — conceptos globales (sin id_sueldo)
export const getConceptosBase = async (req, res) => {
  try {
    const conceptos = await prisma.conceptos.findMany({
      where: { id_sueldo: null }
    });
    res.json(conceptos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener conceptos' });
  }
};

// POST /api/salarios/conceptos
export const createConcepto = async (req, res) => {
  const { nombre, descripcion, credito, debito, afecta_ips, formula } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    const concepto = await prisma.conceptos.create({
      data: {
        nombre,
        descripcion,
        credito: credito ? Number(credito) : null,
        debito: debito ? Number(debito) : null,
        afecta_ips: Boolean(afecta_ips),
        formula
      }
    });
    res.status(201).json(concepto);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear concepto' });
  }
};

// ─── PROCESO DE PAGO ────────────────────────────────────────────

// GET /api/salarios/procesos
export const getProcesos = async (req, res) => {
  try {
    const procesos = await prisma.cabecera_pago.findMany({
      include: {
        sueldos: {
          include: { conceptos: true, contrato: { include: { funcionarios: { include: { personas: true } } } } }
        }
      },
      orderBy: { id_pago: 'desc' }
    });
    res.json(procesos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener procesos de pago' });
  }
};

// POST /api/salarios/procesos  — Abre un nuevo proceso de pago
export const createProceso = async (req, res) => {
  const { periodo, fecha_pago } = req.body;
  if (!periodo) return res.status(400).json({ error: 'periodo es requerido (ej: 2026-04)' });

  try {
    // Verificar que no exista ya un proceso para ese periodo
    const existente = await prisma.cabecera_pago.findFirst({
      where: { periodo, estado: 'pendiente' }
    });
    if (existente) {
      return res.status(400).json({ error: `Ya existe un proceso abierto para el periodo ${periodo}` });
    }

    // Obtener todos los funcionarios activos con su contrato
    const funcionarios = await prisma.funcionarios.findMany({
      include: {
        personas: true,
        familiares: true,
        contrato: {
          where: { fecha_salida: null },
          take: 1,
          orderBy: { fecha_ingreso: 'desc' }
        },
        cargos: true
      }
    });

    const proceso = await prisma.$transaction(async (tx) => {
      // 1. Crear cabecera del proceso
      const cabecera = await tx.cabecera_pago.create({
        data: {
          fecha_emision: fecha_pago ? new Date(fecha_pago) : new Date(),
          periodo,
          tipo_pago: 'SALARIO',
          estado: 'pendiente',
          total: 0
        }
      });

      let totalProceso = 0;

      // 2. Para cada funcionario, generar su sueldo con conceptos
      for (const func of funcionarios) {
        const contrato = func.contrato[0];
        if (!contrato) continue;

        const salarioBase = Number(contrato.salario_base ?? func.cargos?.sueldo_base ?? 0);

        // Calcular hijos menores de 18
        const hijosMenores = func.familiares.filter(fam => {
          const esHijo = ['hijo', 'hija'].includes(fam.parentesco?.toLowerCase() ?? '');
          if (!esHijo || !fam.fecha_nacimiento) return false;
          return calcularEdad(fam.fecha_nacimiento) < 18;
        }).length;

        // Calcular bonificación familiar
        const bonifFamiliar = hijosMenores * (SALARIO_MINIMO * PORCENTAJE_BONIF_FAMILIAR);

        // ── Conceptos extras pendientes de este funcionario ──────────
        // Buscamos en la misma tabla `conceptos`: id_funcionario = X, id_sueldo = null
        const extrasRaw = await tx.conceptos.findMany({
          where: { id_funcionario: func.id_funcionario, id_sueldo: null }
        });

        const extraCreditos = extrasRaw.filter(c => c.credito !== null);
        const extraDebitos  = extrasRaw.filter(c => c.debito  !== null);

        const totalExtraCredito = extraCreditos.reduce((s, c) => s + Number(c.credito ?? 0), 0);
        const totalExtraDebito  = extraDebitos .reduce((s, c) => s + Number(c.debito  ?? 0), 0);

        // Base IPS: salario base + ingresos extras que afectan IPS
        const baseIPS = salarioBase + extraCreditos
          .filter(c => c.afecta_ips)
          .reduce((s, c) => s + Number(c.credito ?? 0), 0);

        const descuentoIPS = baseIPS * PORCENTAJE_IPS;

        const totalSueldo = salarioBase + bonifFamiliar + totalExtraCredito - descuentoIPS - totalExtraDebito;
        totalProceso += totalSueldo;

        // 3. Crear sueldo para este funcionario
        const sueldo = await tx.sueldos.create({
          data: {
            id_pago: cabecera.id_pago,
            nombre_categoria: `${func.personas?.nombre ?? ''} ${func.personas?.apellido ?? ''}`.trim(),
            monto: totalSueldo,
            fecha_vigencia: fecha_pago ? new Date(fecha_pago) : new Date(),
            tipo_sueldo: 'MENSUAL'
          }
        });

        // 4. Crear conceptos del sueldo (fijos + extras)
        const conceptosData = [
          {
            id_sueldo: sueldo.id_sueldo,
            nombre: 'Salario Base',
            descripcion: `Salario base del cargo ${func.cargos?.nombre_cargo ?? ''}`,
            credito: salarioBase,
            debito: null,
            afecta_ips: true
          },
          ...(bonifFamiliar > 0 ? [{
            id_sueldo: sueldo.id_sueldo,
            nombre: 'Bonificación Familiar',
            descripcion: `${hijosMenores} hijo(s) menor(es) de 18 años × 5% salario mínimo`,
            credito: bonifFamiliar,
            debito: null,
            afecta_ips: false
          }] : []),
          {
            id_sueldo: sueldo.id_sueldo,
            nombre: 'Descuento IPS',
            descripcion: `9% sobre base imponible (${baseIPS.toLocaleString('es-PY')} Gs.)`,
            credito: null,
            debito: descuentoIPS,
            afecta_ips: true
          },
          // Extras del funcionario: se copian al recibo de este sueldo
          ...extrasRaw.map(c => ({
            id_sueldo: sueldo.id_sueldo,
            nombre: c.nombre,
            descripcion: c.descripcion,
            credito: c.credito,
            debito: c.debito,
            afecta_ips: c.afecta_ips ?? false,
          }))
        ];

        await tx.conceptos.createMany({ data: conceptosData });

        // 5. Eliminar conceptos de un solo uso (formula != 'recurrente') — ya se aplicaron
        const idsUnicoUso = extrasRaw
          .filter(c => c.formula !== 'recurrente')
          .map(c => c.id_concepto);
        if (idsUnicoUso.length > 0) {
          await tx.conceptos.deleteMany({ where: { id_concepto: { in: idsUnicoUso } } });
        }

        // 6. Vincular sueldo al contrato
        await tx.contrato.update({
          where: { id_contrato: contrato.id_contrato },
          data: { id_sueldo: sueldo.id_sueldo }
        });
      }

      // 6. Actualizar total del proceso
      await tx.cabecera_pago.update({
        where: { id_pago: cabecera.id_pago },
        data: { total: totalProceso }
      });

      return cabecera;
    });

    res.status(201).json({
      ok: true,
      id_pago: proceso.id_pago,
      periodo: proceso.periodo,
      estado: proceso.estado
    });
  } catch (error) {
    console.error('Error al crear proceso de pago:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/salarios/procesos/:id  — detalle de un proceso con recibo por funcionario
export const getProcesoById = async (req, res) => {
  const { id } = req.params;
  try {
    const proceso = await prisma.cabecera_pago.findUnique({
      where: { id_pago: Number(id) },
      include: {
        sueldos: {
          include: {
            conceptos: true,
            contrato: {
              include: {
                funcionarios: {
                  include: { personas: true, cargos: true }
                }
              }
            }
          }
        }
      }
    });
    if (!proceso) return res.status(404).json({ error: 'Proceso no encontrado' });
    res.json(proceso);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proceso' });
  }
};

// POST /api/salarios/procesos/:id/cerrar  — cierra el proceso de pago
export const cerrarProceso = async (req, res) => {
  const { id } = req.params;
  const { id_cuenta } = req.body; // cuenta bancaria desde donde se paga la nómina
  if (!id_cuenta) {
    return res.status(400).json({ error: 'Debes seleccionar la cuenta bancaria desde la cual se realiza el pago de nómina' });
  }

  try {
    const cuenta = await prisma.cuenta_bancaria.findUnique({
      where: { id_cuenta: Number(id_cuenta) }
    });
    if (!cuenta) {
      return res.status(404).json({ error: 'La cuenta bancaria seleccionada no existe' });
    }

    const proceso = await prisma.cabecera_pago.findUnique({
      where: { id_pago: Number(id) }
    });
    if (!proceso) return res.status(404).json({ error: 'Proceso no encontrado' });
    if (proceso.estado === 'pagado') {
      return res.status(400).json({ error: 'El proceso ya está cerrado' });
    }

    // NUEVO: Obtener proceso completo para cálculos
    const procesoFull = await prisma.cabecera_pago.findUnique({
      where: { id_pago: Number(id) },
      include: { sueldos: { include: { conceptos: true } } }
    });

    // NUEVO: Calcular total neto a pagar (estilo tesorería)
    let totalNetoPago = 0;
    procesoFull.sueldos.forEach(sueldo => {
      const ingresos = sueldo.conceptos
        .filter(c => c.credito !== null)
        .reduce((s, c) => s + Number(c.credito ?? 0), 0);
      const egresos = sueldo.conceptos
        .filter(c => c.debito !== null)
        .reduce((s, c) => s + Number(c.debito ?? 0), 0);
      totalNetoPago += (ingresos - egresos);
    });

    // NUEVO: Verificar saldo disponible en la cuenta
    if (cuenta.saldo_disponible === null || cuenta.saldo_disponible < totalNetoPago) {
      return res.status(400).json({ 
        error: 'Saldo insuficiente en la cuenta', 
        detalle: `Saldo disponible: ${cuenta.saldo_disponible ?? 0}, Requerido: ${totalNetoPago}` 
    });
    }

    const actualizado = await prisma.cabecera_pago.update({
      where: { id_pago: Number(id) },
      data: { estado: 'pagado', id_movimiento: null } // se actualizará con el movimiento
    });

    // --- INTEGRACIÓN CON TESORERÍA: crear movimiento bancario de egreso ---
    let movimientoCreado = null;
    try {
      // Usar procesoFull y totalNetoPago ya calculados
      // Crear el movimiento bancario de débito (egreso) por el total neto
      const movimiento = await prisma.movimiento_bancario.create({
        data: {
          id_cuenta: Number(id_cuenta),
          monto_ingreso: 0,
          monto_egreso: Math.abs(totalNetoPago),
          fecha_movimiento: new Date(),
          fecha_confirmacion: new Date(), // pago de nómina se confirma inmediatamente
          tipo_movimiento: 'Débito',
          concepto: `Pago Nómina - Periodo ${procesoFull.periodo}`,
          tipo_deposito: 'Transferencia',
        }
      });

      // Vincular el movimiento a la cabecera de pago
      await prisma.cabecera_pago.update({
        where: { id_pago: Number(id) },
        data: { id_movimiento: movimiento.id_movimiento }
      });

      movimientoCreado = {
        id: movimiento.id_movimiento,
        concepto: movimiento.concepto,
        montoEgreso: movimiento.monto_egreso
      };
    } catch (tesoreriaErr) {
      console.error('Error al crear movimiento bancario de nómina:', tesoreriaErr);
      // Continuamos con el proceso aunque falle el movimiento bancario
      // pero anotamos que no se pudo crear
    }

    // --- INTEGRACIÓN CONTABLE ---
    try {
      const { registrarAsientoAutomatico } = await import('../../utils/asientoAutomatico.utils.js');
      const procesoFull = await prisma.cabecera_pago.findUnique({
        where: { id_pago: Number(id) },
        include: { sueldos: { include: { conceptos: true } } }
      });

      let totalSueldos = 0;
      let totalBonif = 0;
      let totalIPS = 0;
      let totalNeto = 0;

      procesoFull.sueldos.forEach(sueldo => {
        sueldo.conceptos.forEach(c => {
          if (c.nombre === 'Salario Base') totalSueldos += Number(c.credito ?? 0);
          else if (c.nombre === 'Bonificación Familiar') totalBonif += Number(c.credito ?? 0);
          else if (c.nombre === 'Descuento IPS') totalIPS += Number(c.debito ?? 0);
        });
      });
      totalNeto = (totalSueldos + totalBonif) - totalIPS;

      // Generar código contable para la cuenta bancaria si no existe
      const cuentaContableCodigo = `BCTA_${cuenta.numero_cuenta?.replace(/\s+/g, '_') || cuenta.id_cuenta}`;
      
      await registrarAsientoAutomatico({
        fecha: new Date(),
        descripcion: `Pago de Haberes - Periodo ${procesoFull.periodo}`,
        tabla_origen: 'cabecera_pago',
        id_registro_origen: procesoFull.id_pago,
        detalles: [
          { cuenta_codigo: 'SYS-NOM-SUELDOS', monto: totalSueldos, debe_haber: true, glosa: 'Sueldos y Jornales' },
          ...(totalBonif > 0 ? [{ cuenta_codigo: 'SYS-NOM-BONIF', monto: totalBonif, debe_haber: true, glosa: 'Bonificación Familiar' }] : []),
          { cuenta_codigo: 'SYS-NOM-IPS', monto: totalIPS, debe_haber: false, glosa: 'Aportes IPS a Pagar' },
          { cuenta_codigo: cuentaContableCodigo, monto: totalNeto, debe_haber: false, glosa: `Pago Neto de Salarios - ${cuenta.banco} Cta. Nº ${cuenta.numero_cuenta}` }
        ]
      });
    } catch (err) {
      console.error('Error en integración contable de nómina:', err);
    }

    res.json({ 
      ok: true, 
      estado: actualizado.estado,
      movimientoCreado 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar proceso' });
  }
};

// GET /api/salarios/procesos/:id/recibos  — genera recibos de todos los funcionarios
export const getRecibos = async (req, res) => {
  const { id } = req.params;
  try {
    const proceso = await prisma.cabecera_pago.findUnique({
      where: { id_pago: Number(id) },
      include: {
        sueldos: {
          include: {
            conceptos: true,
            contrato: {
              include: {
                funcionarios: {
                  include: { personas: true, cargos: true }
                }
              }
            }
          }
        }
      }
    });
    if (!proceso) return res.status(404).json({ error: 'Proceso no encontrado' });

    const recibos = proceso.sueldos.map(sueldo => {
      const func = sueldo.contrato[0]?.funcionarios;
      const persona = func?.personas;
      const ingresos = sueldo.conceptos.filter(c => c.credito !== null);
      const egresos = sueldo.conceptos.filter(c => c.debito !== null);
      const totalIngresos = ingresos.reduce((acc, c) => acc + Number(c.credito ?? 0), 0);
      const totalEgresos = egresos.reduce((acc, c) => acc + Number(c.debito ?? 0), 0);

      return {
        numero_recibo: `REC-${String(proceso.id_pago).padStart(4, '0')}-${String(sueldo.id_sueldo).padStart(4, '0')}`,
        periodo: proceso.periodo,
        fecha_pago: proceso.fecha_emision,
        funcionario: {
          id: func?.id_funcionario,
          nombre: `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim(),
          ci: persona?.ci,
          cargo: func?.cargos?.nombre_cargo
        },
        ingresos,
        egresos,
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        neto_a_pagar: totalIngresos - totalEgresos
      };
    });

    res.json(recibos);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar recibos' });
  }
};