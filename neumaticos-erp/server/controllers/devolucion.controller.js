import { prisma } from '../lib/prisma.js';

export const procesarDevolucion = async (req, res) => {
  const { id_factura_venta, motivo, items_a_devolver } = req.body;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Validar que la venta no supere las 48 horas 
      const factura = await tx.factura_venta.findUnique({ where: { id_factura_venta } });
      const fechaVenta = new Date(factura.fecha_emision);
      const limite48h = new Date(fechaVenta.getTime() + (48 * 60 * 60 * 1000));

      if (new Date() > limite48h) {
        throw new Error("El plazo de 48 horas para devoluciones ha expirado ");
      }

      // 2. Registrar la Devolución del Cliente 
      const devolucion = await tx.devolucion_cliente.create({
        data: {
          id_factura: id_factura_venta,
          motivo_devolucion: motivo,
          fecha_devolucion: new Date(),
          detalle_devolucion: {
            create: items_a_devolver.map(i => ({
              id_producto_servicio: i.id_producto_servicio,
              cantidad: i.cantidad
            }))
          }
        }
      });

      // 3. Registrar Nota de Crédito vinculada a la devolución 
      await tx.nota_credito_venta.create({
        data: {
          id_devolucion: devolucion.id_devolucion,
          fecha_emision: new Date(),
          nro_nota: Math.floor(Math.random() * 10000), // Ejemplo de nro correlativo
          detalle_nota_credito: {
            create: items_a_devolver.map(i => ({
              id_producto_servicio: i.id_producto_servicio,
              cantidad: i.cantidad,
              monto: i.precio_unitario * i.cantidad
            }))
          }
        }
      });

      // 4. Reponer la existencia del producto al stock 
      for (const item of items_a_devolver) {
        await tx.stock.updateMany({
          where: { id_producto: item.id_producto_servicio },
          data: {
            cantidad: { increment: item.cantidad },
            fecha_modificacion: new Date()
          }
        });
      }

      return devolucion;
    });

    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};