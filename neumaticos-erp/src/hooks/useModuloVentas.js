// src/hooks/useModuloVentas.js - Estado y acciones para módulo Ventas (Zustand-like)

import { useState, useEffect, useCallback } from 'react';
import {
  clientesIniciales,
  presupuestosIniciales,
  facturasVentasIniciales,
  notasCreditoVentasIniciales,
  asientosVentasIniciales,
} from '../data/erpInitialVentas.js';
import * as ventasLogic from '../utils/ventasLogic.js';

export const useModuloVentas = () => {
  // Estado principal
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [facturasVentas, setFacturasVentas] = useState([]);
  const [notasCreditoVentas, setNotasCreditoVentas] = useState([]);
  const [asientosVentas, setAsientosVentas] = useState([]);

  // Load initial data
  useEffect(() => {
    setClientes(clientesIniciales);
    setPresupuestos(presupuestosIniciales);
    setFacturasVentas(facturasVentasIniciales);
    setNotasCreditoVentas(notasCreditoVentasIniciales);
    setAsientosVentas(asientosVentasIniciales);
  }, []);

  // Acción: Agregar cliente
  const agregarCliente = useCallback((nuevoCliente) => {
    setClientes(prev => [...prev, { id: Date.now(), ...nuevoCliente }]);
  }, []);

  // Acción: Solicitar presupuesto
  const solicitarPresupuesto = useCallback((clientId, lineas) => {
    const numero = ventasLogic.nextNumero('PRES', presupuestos);
    const fechaCreacion = new Date().toISOString().split('T')[0];
    const fechaExpiracion = ventasLogic.addDiasHabiles(fechaCreacion, 10).split('T')[0];
    const total = lineas.reduce((sum, l) => sum + l.totalLinea, 0);

    const nuevoPresupuesto = {
      id: Date.now(),
      numero,
      clientId,
      fechaCreacion,
      fechaExpiracion,
      lineas,
      total,
      estado: 'Vigente',
    };

    setPresupuestos(prev => [...prev, nuevoPresupuesto]);
    return nuevoPresupuesto;
  }, [presupuestos]);

  // Acción: Generar factura desde presupuesto
  const generarFactura = useCallback((presupuestoId, inventarioActual, setInventarioExterno) => {
    const presupuesto = presupuestos.find(p => p.id === presupuestoId);
    if (!ventasLogic.isBudgetVigente(presupuesto)) {
      throw new Error('Presupuesto expirado o no vigente');
    }

    const factura = ventasLogic.crearFacturaFromPresupuesto(presupuesto);
    const nuevoInventario = ventasLogic.deductStockFromFactura(factura, inventarioActual);

    // Update stock externo (compras)
    setInventarioExterno(nuevoInventario);

    // Update local
    setPresupuestos(prev => prev.map(p => p.id === presupuestoId ? {...p, estado: 'Convertido'} : p));
    setFacturasVentas(prev => [...prev, factura]);

    // Asiento auto
    const asiento = ventasLogic.generateAsientoFactura(factura);
    setAsientosVentas(prev => [...prev, asiento]);

    return factura;
  }, [presupuestos]);

  // Acción: Nota crédito devolución
  const solicitarNotaCredito = useCallback((facturaId, lineasDevueltas, motivo, inventarioActual, setInventarioExterno) => {
    const factura = facturasVentas.find(f => f.id === facturaId);
    if (!ventasLogic.validarDevolucion(factura)) {
      throw new Error('Devolución fuera de 48 horas');
    }

    const numero = ventasLogic.nextNumero('NCV', notasCreditoVentas);
    const fecha = new Date().toISOString().split('T')[0];
    const total = lineasDevueltas.reduce((sum, l) => sum + (l.cantidad * l.precioUnitario), 0);

    const nuevaNC = {
      id: Date.now(),
      numero,
      facturaId,
      fecha,
      motivo,
      lineasDevueltas,
      total,
    };

    const nuevoInventario = ventasLogic.restockFromNotaCredito(nuevaNC, inventarioActual);
    setInventarioExterno(nuevoInventario);

    setNotasCreditoVentas(prev => [...prev, nuevaNC]);
    setFacturasVentas(prev => prev.map(f => f.id === facturaId ? {...f, estado: 'Con NC'} : f));

    const asiento = ventasLogic.generateAsientoNotaCredito(nuevaNC);
    setAsientosVentas(prev => [...prev, asiento]);

    return nuevaNC;
  }, [facturasVentas, notasCreditoVentas]);

  // Computed: KPIs para dashboard
  const kpis = {
    presupuestosVigentes: presupuestos.filter(p => ventasLogic.isBudgetVigente(p)).length,
    facturasPendientes: facturasVentas.filter(f => f.estado !== 'Cobrado').length,
    totalVentasMes: facturasVentas.reduce((sum, f) => sum + f.total, 0),
  };

  return {
    clientes,
    presupuestos,
    facturasVentas,
    notasCreditoVentas,
    asientosVentas,
    kpis,
    actions: {
      agregarCliente,
      solicitarPresupuesto,
      generarFactura,
      solicitarNotaCredito,
    },
  };
};

