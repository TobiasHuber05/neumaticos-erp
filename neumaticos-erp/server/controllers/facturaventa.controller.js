import { prisma } from '../lib/prisma.js';

export const generarFactura = async (req, res) => {
  const { id_presupuesto, nro_factura, timbrado, contado_credito } = req.body;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener presupuesto y validar vigencia de 10 días 
      const presupuesto = await tx.presupuesto.findUnique({
        where: { id_presupuesto },
        include: { detalle_presupuesto: true }
      });

      if (!presupuesto || new Date() > new Date(presupuesto.fecha_vencimiento)) {
        throw new Error("Presupuesto inexistente o vencido (máx 10 días hábiles) ");
      }

      // 2. Registrar la factura 
      const factura = await tx.factura_venta.create({
        data: {
          id_presupuesto,
          id_cliente: presupuesto.id_cliente,
          fecha_emision: new Date(),
          timbrado,
          nro_factura,
          contado_credito,
          total: presupuesto.total,
          detalle_factura_venta: {
            create: presupuesto.detalle_presupuesto.map(d => ({
              id_producto_servicio: d.id_producto_servicio,
              cantidad: d.cantidad_producto,
              precio_unitario: d.precio_unitario,
              subtotal: d.cantidad_producto * d.precio_unitario,
              total: d.cantidad_producto * d.precio_unitario
            }))
          }
        },
        include: { detalle_factura_venta: true }
      });

      // 3. Descontar del stock correspondiente 
      for (const item of factura.detalle_factura_venta) {
        // Obtenemos el producto real desde producto_servicio
        const prodServ = await tx.producto_servicio.findUnique({
          where: { id_producto_servicio: item.id_producto_servicio }
        });

        if (prodServ && prodServ.id_producto) {
          await tx.stock.updateMany({
            where: { id_producto: prodServ.id_producto },
            data: {
              cantidad: { decrement: item.cantidad },
              fecha_modificacion: new Date()
            }
          });
        }
      }

      return factura;
    });

    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getFactura = async (req, res) => {
  try {
    const facturas = await prisma.factura_venta.findMany({
      include: { detalle_factura_venta: true }
    });
    res.json(facturas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
