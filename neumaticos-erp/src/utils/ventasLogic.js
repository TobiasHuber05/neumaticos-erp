// src/utils/ventasLogic.js - Lógica de negocio Ventas y Facturación

const addDiasHabiles = (fecha, dias) => {
  let fechaNueva = new Date(fecha);
  let diasRestantes = dias;
  while (diasRestantes > 0) {
    fechaNueva.setDate(fechaNueva.getDate() + 1);
    if (fechaNueva.getDay() !== 0 && fechaNueva.getDay() !== 6) { // No dom/sab
      diasRestantes--;
    }
  }
  return fechaNueva.toISOString().split('T')[0];
};

const nextNumero = (tipo, existentes) => {
  const nums = existentes.map(item => parseInt(item.numero.replace(/[^0-9]/g, '')) || 0);
  const max = Math.max(...nums, 0);
  return `${tipo}-${String(max + 1).padStart(3, '0')}`;
};

// 1. Validar presupuesto vigente
export const isBudgetVigente = (presupuesto) => {
  return new Date(presupuesto.fechaExpiracion) > new Date() && presupuesto.estado === 'Vigente';
};

// 2. Crear factura desde presupuesto
export const crearFacturaFromPresupuesto = (presupuesto) => {
  const ahora = new Date();
  return {
    id: Date.now(),
    numero: nextNumero('FACV', []),
    presupuestoId: presupuesto.id,
    clientId: presupuesto.clientId,
    fechaFactura: ahora.toISOString().split('T')[0],
    lineas: [...presupuesto.lineas],
    total: presupuesto.total,
    estado: 'Emitida',
    fecha48h: new Date(ahora.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
};

// 3. Descontar stock al facturar
export const deductStockFromFactura = (factura, inventarioActual) => {
  const nuevoInventario = [...inventarioActual];
  factura.lineas.forEach(linea => {
    const prodIdx = nuevoInventario.findIndex(p => (p.id_producto_servicio === linea.productoId) || (p.id === linea.productoId));
    if (prodIdx !== -1) {
      nuevoInventario[prodIdx].stock -= linea.cantidad;
    }
  });
  return nuevoInventario;
};

// 4. Validar y procesar devolución NC <48h
export const validarDevolucion = (factura) => {
  return new Date(factura.fecha48h) > new Date();
};

export const restockFromNotaCredito = (notaCredito, inventarioActual) => {
  const motivosQueDevuelvenStock = ['Producto equivocado', 'Cliente cambió opinión'];
  const debeDevolverStock = motivosQueDevuelvenStock.includes(notaCredito.motivo);

  const nuevoInventario = [...inventarioActual];

  if (debeDevolverStock) {
    notaCredito.lineasDevueltas.forEach(linea => {
      const prodIdx = nuevoInventario.findIndex(p => (p.id_producto_servicio === linea.productoId) || (p.id === linea.productoId));
      if (prodIdx !== -1) {
        nuevoInventario[prodIdx] = { ...nuevoInventario[prodIdx], stock: nuevoInventario[prodIdx].stock + (linea.cantidadDevolver || linea.cantidad) };
      }
    });
  }

  return nuevoInventario;
};

// 5. Generar asiento factura
export const generateAsientoFactura = (factura) => ({
  id: Date.now(),
  tipo: 'Factura Emitida',
  facturaId: factura.id,
  fecha: factura.fechaFactura,
  descripcion: `FACV ${factura.numero} - Total Gs. ${factura.total.toLocaleString()}`,
  debe: 0,
  haber: factura.total,
  cuenta: 'Ventas',
});

// 6. Generar asiento nota crédito (reverso)
export const generateAsientoNotaCredito = (notaCredito) => ({
  id: Date.now(),
  tipo: 'Nota Crédito',
  notaCreditoId: notaCredito.id,
  fecha: notaCredito.fecha,
  descripcion: `NC ${notaCredito.numero} - Devolución Gs. ${notaCredito.total.toLocaleString()}`,
  debe: notaCredito.total,
  haber: 0,
  cuenta: 'Devoluciones Ventas',
});

// Helpers
export const getClienteById = (clientId, clientes) => clientes.find(c => c.id === clientId);
export const formatMonto = (monto) => `Gs. ${parseInt(monto).toLocaleString()}`;