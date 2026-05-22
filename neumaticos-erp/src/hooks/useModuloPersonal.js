import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { configuracionNominaInicial } from '../data/erpInitialPersonal.js';
import * as personalLogic from '../utils/personalLogic.js';

const API = 'http://localhost:3000/api';

// ── Mapea la respuesta del backend al formato que espera el frontend ──
const mapearFuncionario = (f) => {
  const contrato = f.contrato?.[0];
  return {
    id:          f.id,
    nombre:      f.persona
                   ? `${f.persona.nombre ?? ''} ${f.persona.apellido ?? ''}`.trim()
                   : '—',
    documento:   f.persona?.ci ?? '—',
    fechaIngreso: contrato?.fecha_ingreso?.split('T')[0] ?? '—',
    salarioBase:  Number(contrato?.salario_base ?? f.cargo?.sueldo_base ?? 0),
    cargoActual:  f.cargo?.nombre_cargo ?? 'Sin cargo',
    nucleoFamiliar: (f.familiares ?? []).map(fam => ({
      id:              fam.id_familiar,
      nombre:          fam.personas?.nombre ?? 'Sin nombre',
      cedula:          fam.personas?.ci     ?? null,
      parentesco:      fam.parentesco       ?? '',
      fechaNacimiento: fam.fecha_nacimiento?.split('T')[0] ?? null,
    })),
    historialCargos: (f.historial ?? []).map(h => ({
      cargo: h.cargos?.nombre_cargo ?? '—',
      fecha: h.fecha_ingreso?.split('T')[0] ?? '—',
    })),
    hijos_menores: f.hijos_menores ?? 0,
    estado: 'Activo',
  };
};

const mapearProceso = (p) => ({
  id:        p.id_pago,
  periodo:   p.periodo,
  fechaPago: p.fecha_emision?.split('T')[0] ?? '—',
  estado:    p.estado === 'pagado' ? 'Cerrado' : 'Abierto',
  total:     Number(p.total ?? 0),
  liquidaciones: (p.sueldos ?? []).map(s => ({
    funcionarioId:   s.contrato?.[0]?.funcionarios?.id_funcionario,
    funcionarioNombre: s.nombre_categoria,
    neto:            Number(s.monto ?? 0),
    totalIngresos:   (s.conceptos ?? [])
                       .filter(c => c.credito !== null)
                       .reduce((sum, c) => sum + Number(c.credito ?? 0), 0),
    totalEgresos:    (s.conceptos ?? [])
                       .filter(c => c.debito !== null)
                       .reduce((sum, c) => sum + Number(c.debito ?? 0), 0),
    lineas: (s.conceptos ?? []).map(c => ({
      nombre: c.nombre,
      tipo:   c.credito !== null ? 'Ingreso' : 'Egreso',
      monto:  Number(c.credito ?? c.debito ?? 0),
      esIPS:  c.afecta_ips ?? false,
    })),
  })),
});

const mapearAsiento = (a) => ({
  id:          `ASNP-${String(a.id_asiento).padStart(3, '0')}`,
  fecha:       a.fecha?.split('T')[0] ?? '—',
  descripcion: a.descripcion,
  detalles:    (a.asiento_detalle ?? []).map(d => ({
    cuenta: d.plan_cuentas?.nombre ?? `Cuenta ${d.id_cuenta}`,
    debe:   d.debe_haber ? Number(d.monto) : 0,
    haber:  d.debe_haber ? 0 : Number(d.monto),
  })),
});

export const useModuloPersonal = () => {
  const [funcionarios,  setFuncionarios]  = useState([]);
  const [conceptos,     setConceptos]     = useState([]);
  const [procesosPago,  setProcesosPago]  = useState([]);
  const [asientosNomina,setAsientosNomina]= useState([]);
  const [config,        setConfig]        = useState(configuracionNominaInicial);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // ── Carga inicial ────────────────────────────────────────────
const cargarDatos = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const [resFuncs, resConceptos, resProcesos, resAsientos] = await Promise.all([
      axios.get(`${API}/funcionarios`),
      axios.get(`${API}/salarios/conceptos`),
      axios.get(`${API}/salarios/procesos`),
      axios.get(`${API}/asientos-nomina`).catch(() => ({ data: [] })), // ← no rompe si falla
    ]);

    setFuncionarios(resFuncs.data.map(mapearFuncionario));
    setConceptos(resConceptos.data);
    setProcesosPago(resProcesos.data.map(mapearProceso));
    setAsientosNomina(resAsientos.data.map(mapearAsiento));
  } catch (err) {
    console.error('Error cargando datos personales:', err);
    setError('Error al conectar con el servidor');
  } finally {
    setLoading(false);
  }
}, []);
useEffect(() => {
  cargarDatos();
}, [cargarDatos]);

  // ── CRUD Funcionarios ────────────────────────────────────────
const agregarFuncionario = useCallback(async (nuevo) => {
  try {
    await axios.post(`${API}/funcionarios`, {
      nombre:           nuevo.nombre,
      apellido:         nuevo.apellido,
      ci:               nuevo.ci,          
      ruc:              nuevo.ruc,
      estado_civil:     nuevo.estado_civil,
      sexo:             nuevo.sexo,
      fecha_nacimiento: nuevo.fecha_nacimiento || null,
      id_cargo:         nuevo.id_cargo     ? Number(nuevo.id_cargo)    : null,
      fecha_ingreso:    nuevo.fecha_ingreso || null,
      salario_base:     nuevo.salario_base ? Number(nuevo.salario_base): null,
      familiares:       nuevo.familiares   ?? [],
    });

    await cargarDatos();
  } catch (err) {
    console.error('Error al agregar funcionario:', err);
    throw err;
  }
}, [cargarDatos]);

  const actualizarCargo = useCallback(async (funcionarioId, id_cargo, fecha) => {
    try {
      await axios.put(`${API}/funcionarios/${funcionarioId}`, {
        id_cargo,
        fecha_ingreso: fecha,
      });
      await cargarDatos();
    } catch (err) {
      console.error('Error al actualizar cargo:', err);
      throw err;
    }
  }, [cargarDatos]);

  const eliminarFuncionario = useCallback(async (id) => {
    try {
      await axios.delete(`${API}/funcionarios/${id}`);
      await cargarDatos();
    } catch (err) {
      console.error('Error al eliminar funcionario:', err);
      throw err;
    }
  }, [cargarDatos]);

  // ── Nómina ───────────────────────────────────────────────────
  const iniciarProcesoPago = useCallback(async (periodo, fechaPago) => {
    try {
      const res = await axios.post(`${API}/salarios/procesos`, {
        periodo,
        fecha_pago: fechaPago,
      });
      await cargarDatos();
      return res.data;
    } catch (err) {
      console.error('Error al iniciar proceso:', err);
      throw err;
    }
  }, [cargarDatos]);

  const cerrarProcesoPago = useCallback(async (procesoId) => {
    try {
      // 1. Cerrar el proceso en la BD
      await axios.post(`${API}/salarios/procesos/${procesoId}/cerrar`);

      // 2. Tomar los datos del proceso para construir el asiento
      const proceso = procesosPago.find(p => p.id === procesoId);
      if (proceso) {
        // Calcular totales desde las liquidaciones
        const totalSueldos = proceso.liquidaciones.reduce((s, liq) => {
          const sb = liq.lineas.find(l => l.nombre === 'Salario Base');
          return s + (sb ? sb.monto : 0);
        }, 0);

        const totalBonif = proceso.liquidaciones.reduce((s, liq) => {
          const bn = liq.lineas.find(l => l.nombre === 'Bonificación Familiar');
          return s + (bn ? bn.monto : 0);
        }, 0);

        const totalIPS = proceso.liquidaciones.reduce((s, liq) => {
          const ip = liq.lineas.find(l => l.nombre === 'Descuento IPS');
          return s + (ip ? ip.monto : 0);
        }, 0);

        const totalNeto = proceso.liquidaciones.reduce((s, liq) => s + liq.neto, 0);

        // 3. Guardar asiento en la BD
        const detalles = [
          { cuenta_contable: 'SYS-NOM-SUELDOS', nombre_cuenta: 'Sueldos y Jornales',                   debe: totalSueldos, haber: 0 },
          { cuenta_contable: 'SYS-NOM-IPS',     nombre_cuenta: 'Aportes y Retenciones a Pagar (IPS)',  debe: 0,            haber: totalIPS },
          { cuenta_contable: 'SYS-NOM-CAJA',    nombre_cuenta: 'Caja y Banco (Pago Nómina)',            debe: 0,            haber: totalNeto },
        ];

        // Agregar bonif solo si hay monto
        if (totalBonif > 0) {
          detalles.splice(1, 0, {
            cuenta_contable: 'SYS-NOM-BONIF',
            nombre_cuenta:   'Bonificación Familiar',
            debe: totalBonif,
            haber: 0
          });
        }

        await axios.post(`${API}/asientos`, {
          descripcion:        `Nómina de Salarios - Periodo ${proceso.periodo}`,
          fecha:              proceso.fechaPago,
          tabla_origen:       'nomina',
          id_registro_origen: procesoId,
          detalles,
        });
      }

      await cargarDatos();
    } catch (err) {
      console.error('Error al cerrar proceso:', err);
      throw err;
    }
}, [cargarDatos, procesosPago]);

  const getRecibos = useCallback(async (procesoId) => {
    const res = await axios.get(`${API}/salarios/procesos/${procesoId}/recibos`);
    return res.data;
  }, []);

  // KPIs 
  const ultimoProcesoCerrado = [...procesosPago]
    .filter(p => p.estado === 'Cerrado')
    .sort((a, b) => b.id - a.id)[0];

  const kpis = {
    totalFuncionarios: funcionarios.length,
    nominaUltimoMes:   ultimoProcesoCerrado
      ? ultimoProcesoCerrado.liquidaciones.reduce((s, l) => s + l.neto, 0)
      : funcionarios.reduce((s, f) => s + f.salarioBase, 0),
    costoLaboralTotal: funcionarios.reduce((s, f) => s + f.salarioBase, 0),
  };

  return {
    funcionarios,
    conceptos,
    config,
    procesosPago,
    asientosNomina,
    kpis,
    loading,
    error,
    actions: {
      agregarFuncionario,
      actualizarCargo,
      eliminarFuncionario,
      iniciarProcesoPago,
      cerrarProcesoPago,
      getRecibos,
      setConfig,
      recargar: cargarDatos,
    },
  };
};