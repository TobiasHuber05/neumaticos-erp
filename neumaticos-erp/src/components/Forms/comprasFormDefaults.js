/**
 * Valores editables para etiquetas, motivos y textos de formularios del módulo Compras.
 * Modificá este archivo para ajustar opciones sin tocar la lógica de pantallas.
 */

export const MOTIVOS_DEVOLUCION = [
  'Producto dañado o en mal estado',
  'No corresponde a la orden de compra',
  'Cantidad excede lo acordado',
  'Vencimiento o lote no conforme',
  'Otro',
];

export const ESTADOS_PEDIDO_COMPRA = {
  PENDIENTE_COTIZACION: 'Pendiente Cotización',
  EN_COTIZACION: 'En Cotización',
  ADJUDICADO: 'Adjudicado / Ordenado',
};

export const LABELS = {
  pedidoCompra: 'Pedido de compra de productos',
  pedidoCotizacion: 'Pedido de cotización',
  ordenCompra: 'Orden de compra',
  facturaProveedor: 'Factura del proveedor',
  notaDevolucion: 'Nota de devolución',
  notaCreditoRecibida: 'Nota de crédito recibida (proveedor)',
  ordenPago: 'Orden de pago a proveedores',
  asientoCompra: 'Compra a proveedores',
  asientoNC: 'Notas de crédito recibidas',
};
