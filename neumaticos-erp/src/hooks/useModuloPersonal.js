// src/hooks/useModuloPersonal.js - Hook para gestión de RRHH y Nómina

import { useState, useEffect, useCallback } from 'react';
import {
  funcionariosIniciales,
  conceptosSalarialesIniciales,
  configuracionNominaInicial,
  procesosPagoIniciales,
  asientosNominaIniciales,
} from '../data/erpInitialPersonal.js';
import * as personalLogic from '../utils/personalLogic.js';

export const useModuloPersonal = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [config, setConfig] = useState(configuracionNominaInicial);
  const [procesosPago, setProcesosPago] = useState([]);
  const [asientosNomina, setAsientosNomina] = useState([]);

  // Carga inicial
  useEffect(() => {
    setFuncionarios(funcionariosIniciales);
    setConceptos(conceptosSalarialesIniciales);
    setProcesosPago(procesosPagoIniciales);
    setAsientosNomina(asientosNominaIniciales);
  }, []);

  // Acciones: Funcionarios
  const agregarFuncionario = useCallback((nuevo) => {
    setFuncionarios(prev => [...prev, { 
        id: Date.now(), 
        ...nuevo, 
        estado: 'Activo',
        historialCargos: [{ cargo: nuevo.cargoActual, fecha: nuevo.fechaIngreso }]
    }]);
  }, []);

  const actualizarCargo = useCallback((funcionarioId, nuevoCargo, fecha) => {
      setFuncionarios(prev => prev.map(f => {
          if (f.id === funcionarioId) {
              return {
                  ...f,
                  cargoActual: nuevoCargo,
                  historialCargos: [...f.historialCargos, { cargo: nuevoCargo, fecha }]
              };
          }
          return f;
      }));
  }, []);

  // Acciones: Nómina
  const iniciarProcesoPago = useCallback((periodo, fechaPago) => {
    const nuevoProceso = {
      id: Date.now(),
      periodo,
      fechaPago,
      estado: 'Abierto',
      liquidaciones: []
    };
    setProcesosPago(prev => [...prev, nuevoProceso]);
    return nuevoProceso;
  }, []);

  const calcularNominaMasiva = useCallback((procesoId) => {
    setProcesosPago(prev => prev.map(p => {
      if (p.id === procesoId) {
        const liquidaciones = funcionarios
          .filter(f => f.estado === 'Activo')
          .map(f => personalLogic.generarLiquidacionFuncionario(f, conceptos, config));
        
        return { ...p, liquidaciones };
      }
      return p;
    }));
  }, [funcionarios, conceptos, config]);

  const cerrarProcesoPago = useCallback((procesoId) => {
    let procesoFinal;
    setProcesosPago(prev => prev.map(p => {
      if (p.id === procesoId) {
        procesoFinal = { ...p, estado: 'Cerrado' };
        return procesoFinal;
      }
      return p;
    }));

    // Generar Asiento
    if (procesoFinal) {
      const nuevoAsiento = personalLogic.generarAsientoNomina(procesoFinal);
      setAsientosNomina(prev => [...prev, nuevoAsiento]);
    }
  }, []);

  // KPIs
  const kpis = {
    totalFuncionarios: funcionarios.length,
    nominaUltimoMes: procesosPago.length > 0 ? procesosPago[procesosPago.length - 1].liquidaciones.reduce((s, l) => s + l.neto, 0) : 0,
    costoLaboralTotal: funcionarios.reduce((s, f) => s + f.salarioBase, 0)
  };

  return {
    funcionarios,
    conceptos,
    config,
    procesosPago,
    asientosNomina,
    kpis,
    actions: {
      agregarFuncionario,
      actualizarCargo,
      iniciarProcesoPago,
      calcularNominaMasiva,
      cerrarProcesoPago,
      setConfig
    }
  };
};
