// src/hooks/useModuloVentas.js

import { useState, useEffect, useCallback } from 'react';
import * as ventasLogic from '../utils/ventasLogic.js';

const API_CLIENTES = '/api/clientes';
const API_PRESUPUESTOS = '/api/presupuestos';
const API_FACTURAS = '/api/facturas';
const API_DEVOLUCIONES = '/api/devoluciones';
const API_ASIENTOS_VENTAS = '/api/asientos-ventas';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

export const useModuloVentas = () => {
  const [clientes, setClientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [facturasVentas, setFacturasVentas] = useState([]);
  const [notasCreditoVentas, setNotasCreditoVentas] = useState([]);
  const [asientosVentas, setAsientosVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Carga inicial ────────────────────────────────────────────────────────────
  const fetchDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resClientes, resPresupuestos, resFacturas, resNotaCredito, resAsientos] = await Promise.all([
        fetch(API_CLIENTES, { headers: getHeaders() }),
        fetch(API_PRESUPUESTOS, { headers: getHeaders() }),
        fetch(API_FACTURAS, { headers: getHeaders() }),
        fetch(API_DEVOLUCIONES, { headers: getHeaders() }),
        fetch(API_ASIENTOS_VENTAS, { headers: getHeaders() }),
      ]);

      const [clientesData, presupuestosData, facturasData, devolucionData, asientosData] = await Promise.all([
        resClientes.json(),
        resPresupuestos.json(),
        resFacturas.json(),
        resNotaCredito.json(),
        resAsientos.ok ? resAsientos.json() : Promise.resolve([]),
      ]);


      // Backend: { id_cliente, nombre, apellido, ruc, fecha_nacimiento, email }
      // Frontend: { id, nombre, apellido, documento, fechaNacimiento, email }
      setClientes(clientesData.map(c => ({
        id: c.id_cliente,
        nombre: c.nombre,
        apellido: c.apellido,
        documento: c.ruc,
        fechaNacimiento: c.fecha_nacimiento?.split('T')[0],
        correo: c.correo,
      })));

      // Backend devuelve presupuesto con include: { cliente: true, detalle_presupuesto: true }
      setPresupuestos(presupuestosData.map(p => ({
        id: p.id_presupuesto,
        clientId: p.id_cliente,
        fechaCreacion: p.fecha_emision?.split('T')[0],
        fechaExpiracion: p.fecha_vencimiento?.split('T')[0],
        estado: p.estado,
        total: p.total,
        lineas: (p.detalle_presupuesto ?? []).map(d => ({
          productoId: d.id_producto, // Presupuestos usan id_producto en backend
          cantidad: d.cantidad_producto,
          precioUnitario: d.precio_unitario,
          totalLinea: d.cantidad_producto * d.precio_unitario,
        })),
      })));

      // Backend: { id_factura_venta, id_presupuesto, id_cliente, fecha_emision, total, detalle_factura_venta }
      setFacturasVentas(facturasData.map(f => {
        // Calcular historial de devoluciones para esta factura
        const devoluciones = f.devolucion_cliente || [];
        const devueltosPorProd = {};
        
        devoluciones.forEach(dev => {
          (dev.detalle_devolucion || []).forEach(dDev => {
            devueltosPorProd[dDev.id_producto_servicio] = (devueltosPorProd[dDev.id_producto_servicio] || 0) + Number(dDev.cantidad || 0);
          });
        });

        const lineasMap = (f.detalle_factura_venta ?? []).map(d => {
          const qty = Number(d.cantidad ?? 0);
          const devuelto = devueltosPorProd[d.id_producto_servicio] || 0;
          return {
            productoId: d.id_producto_servicio,
            cantidad: qty,
            cantidadDevuelta: devuelto, // Nuevo campo para trackear límite
            precioUnitario: Number(d.precio_unitario ?? 0),
            totalLinea: Number(d.subtotal ?? 0),
          };
        });

        const totalQtyFacturada = lineasMap.reduce((acc, l) => acc + l.cantidad, 0);
        const totalQtyDevuelta = lineasMap.reduce((acc, l) => acc + l.cantidadDevuelta, 0);

        let estadoFinal = f.estado ?? 'Emitida';
        if (totalQtyDevuelta > 0) {
          estadoFinal = totalQtyDevuelta >= totalQtyFacturada ? 'Con NC' : 'Con NC Parcial';
        }

        return {
          id: f.id_factura_venta,
          numero: f.nro_factura || f.id_factura_venta.toString(),
          presupuestoId: f.id_presupuesto,
          clientId: f.id_cliente,
          fechaFactura: f.fecha_emision?.split('T')[0],
          total: f.total,
          estado: estadoFinal,
          fecha48h: new Date(
            new Date(f.fecha_emision).getTime() + 48 * 60 * 60 * 1000
          ).toISOString().split('T')[0],
          lineas: lineasMap,
        };
      }));
      setNotasCreditoVentas(devolucionData.map(n => ({
        id: n.id_nota_credito_venta,
        facturaId: n.devolucion_cliente?.id_factura,
        fecha: n.fecha_emision?.split('T')[0],
        numero: n.nro_nota,
        motivo: n.devolucion_cliente?.motivo_devolucion,
        total: n.detalle_nota_credito?.reduce(
          (sum, d) => sum + Number(d.monto ?? 0), 0
        ),
      })));

      setAsientosVentas(Array.isArray(asientosData) ? asientosData.map(a => {
        // Obtenemos los nombres de las cuentas principales para mostrar en el resumen
        const cuentasNombres = (a.asiento_detalle || [])
          .map(det => det.plan_cuentas?.nombre)
          .filter(Boolean);
        
        const cuentaResumen = cuentasNombres.length > 2 
          ? 'Varias cuentas' 
          : cuentasNombres.join(' / ') || 'Varias cuentas';

        return {
          id: a.id_asiento,
          fecha: a.fecha?.split('T')[0],
          nro_asiento: a.numero_asiento,
          descripcion: a.descripcion,
          debe: Number(a.total_debe || 0),
          haber: Number(a.total_haber || 0),
          tipo: a.tabla_origen === 'factura_venta' ? 'Factura Emitida' : 'Nota Crédito',
          cuenta: cuentaResumen,
          estado: a.estado
        };
      }) : []);

    } catch (err) {
      setError('Error al cargar datos de ventas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  // ── CLIENTES ─────────────────────────────────────────────────────────────────

  const agregarCliente = useCallback(async (nuevoCliente) => {
    const res = await fetch(API_CLIENTES, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        nombre: nuevoCliente.nombre,
        apellido: nuevoCliente.apellido,
        ruc: nuevoCliente.documento,
        fecha_nacimiento: nuevoCliente.fechaNacimiento,
        correo: nuevoCliente.correo,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detalle || err.error || 'Error al crear cliente');
    }

    const data = await res.json();
    const clienteCreado = {
      id: data.id_cliente,
      nombre: data.nombre,
      apellido: data.apellido,
      documento: data.ruc,
      fechaNacimiento: data.fecha_nacimiento?.split('T')[0],
      correo: data.correo,
    };

    setClientes(prev => [...prev, clienteCreado]);
    return clienteCreado;
  }, []);

  // ── PRESUPUESTOS ─────────────────────────────────────────────────────────────

  const solicitarPresupuesto = useCallback(async (clientId, lineas) => {
    const res = await fetch(API_PRESUPUESTOS, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        id_cliente: clientId,
        items: lineas.map(l => ({
          id_producto: l.productoId, // Backend requiere id_producto para presupuestos
          cantidad_producto: l.cantidad,
          precio_unitario: l.precioUnitario,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear presupuesto');
    }

    const data = await res.json();
    const presupuestoCreado = {
      id: data.id_presupuesto,
      clientId: data.id_cliente,
      fechaCreacion: data.fecha_emision?.split('T')[0],
      fechaExpiracion: data.fecha_vencimiento?.split('T')[0],
      estado: data.estado,
      total: data.total,
      lineas,
    };

    setPresupuestos(prev => [...prev, presupuestoCreado]);
    return presupuestoCreado;
  }, []);

  // ── FACTURAS ─────────────────────────────────────────────────────────────────

  const generarFactura = useCallback(async (presupuestoId, datosFactura, inventarioActual, setInventarioExterno) => {
    const presupuesto = presupuestos.find(p => p.id === presupuestoId);
    if (!ventasLogic.isBudgetVigente(presupuesto)) {
      throw new Error('Presupuesto expirado o no vigente');
    }

    const res = await fetch(`${API_FACTURAS}/generar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        id_presupuesto: presupuestoId,
        nro_factura: datosFactura.nro_factura,
        timbrado: datosFactura.timbrado,
        contado_credito: datosFactura.contado_credito,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al generar factura');
    }

    const data = await res.json();
    const facturaCreada = {
      id: data.id_factura_venta,
      presupuestoId: data.id_presupuesto,
      clientId: data.id_cliente,
      fechaFactura: data.fecha_emision?.split('T')[0],
      total: data.total,
      estado: 'Emitida',
      fecha48h: new Date(
        new Date(data.fecha_emision).getTime() + 48 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
      lineas: (data.detalle_factura_venta ?? []).map(d => ({
        productoId: d.id_producto_servicio,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        totalLinea: d.subtotal,
      })),
    };

    const nuevoInventario = ventasLogic.deductStockFromFactura(
      { lineas: facturaCreada.lineas },
      inventarioActual
    );
    setInventarioExterno(nuevoInventario);

    setPresupuestos(prev =>
      prev.map(p => p.id === presupuestoId ? { ...p, estado: 'Convertido' } : p)
    );
    setFacturasVentas(prev => [...prev, facturaCreada]);

    const asiento = ventasLogic.generateAsientoFactura(facturaCreada);
    setAsientosVentas(prev => [...prev, asiento]);

    return facturaCreada;
  }, [presupuestos]);

  // ── DEVOLUCIONES / NOTA DE CRÉDITO ───────────────────────────────────────────

  const solicitarNotaCredito = useCallback(async (
    facturaId, lineasDevueltas, motivo, inventarioActual, setInventarioExterno
  ) => {
    const factura = facturasVentas.find(f => f.id === facturaId);
    if (!ventasLogic.validarDevolucion(factura)) {
      throw new Error('Devolución fuera de las 48 horas permitidas');
    }

    const res = await fetch(API_DEVOLUCIONES, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        id_factura_venta: facturaId,
        motivo,
        items_a_devolver: lineasDevueltas.map(l => ({
          id_producto_servicio: l.productoId,
          cantidad: l.cantidadDevolver,
          precio_unitario: l.precioUnitario,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al procesar devolución');
    }

    const data = await res.json();
    const nuevaNC = {
      id: data.notaCredito?.id_nota_credito_venta || data.id_devolucion,
      facturaId,
      fecha: new Date().toISOString().split('T')[0],
      numero: data.notaCredito?.nro_nota || 'Pendiente',
      motivo,
      lineasDevueltas,
      total: lineasDevueltas.reduce((sum, l) => sum + l.cantidadDevolver * l.precioUnitario, 0),
    };

    const nuevoInventario = ventasLogic.restockFromNotaCredito(
      { lineasDevueltas, motivo },
      inventarioActual
    );
    setInventarioExterno(nuevoInventario);

    setNotasCreditoVentas(prev => [...prev, nuevaNC]);
    setFacturasVentas(prev =>
      prev.map(f => {
        if (f.id === facturaId) {
          // Actualizar las lineas locales restando lo que se acaba de devolver
          const lineasActualizadas = f.lineas.map(l => {
            const devuelta = lineasDevueltas.find(ld => ld.productoId === l.productoId)?.cantidadDevolver || 0;
            return { ...l, cantidadDevuelta: (l.cantidadDevuelta || 0) + devuelta };
          });

          const totalFacturada = lineasActualizadas.reduce((acc, l) => acc + l.cantidad, 0);
          const totalDevuelta = lineasActualizadas.reduce((acc, l) => acc + l.cantidadDevuelta, 0);

          return {
            ...f,
            lineas: lineasActualizadas,
            estado: totalDevuelta >= totalFacturada ? 'Con NC' : 'Con NC Parcial'
          };
        }
        return f;
      })
    );

    const asiento = ventasLogic.generateAsientoNotaCredito(nuevaNC);
    setAsientosVentas(prev => [...prev, asiento]);

    return nuevaNC;
  }, [facturasVentas]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
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
    loading,
    error,
    actions: {
      agregarCliente,
      solicitarPresupuesto,
      generarFactura,
      solicitarNotaCredito,
    },
    refetch: fetchDatos,
  };
};

export default useModuloVentas;
