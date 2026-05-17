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
      const ultimaNota = await tx.nota_credito_venta.findFirst({
        orderBy: { id_nota_credito_venta: 'desc' }
      });
      const siguienteNumero = ultimaNota ? parseInt(ultimaNota.nro_nota.replace('NC-', '')) + 1 : 1;
      const nroNotaFormateado = `NC-${String(siguienteNumero).padStart(4, '0')}`;

      const notaCredito = await tx.nota_credito_venta.create({
        data: {
          id_devolucion: devolucion.id_devolucion,
          fecha_emision: new Date(),
          nro_nota: nroNotaFormateado,
          detalle_nota_credito: {
            create: items_a_devolver.map(i => ({
              id_producto_servicio: i.id_producto_servicio,
              cantidad: i.cantidad,
              monto: i.precio_unitario * i.cantidad
            }))
          }
        }
      });

      // 4. Reponer la existencia del producto al stock (SOLO si corresponde)
      // Si el producto está dañado, no vuelve al stock disponible.
      const motivosQueDevuelvenStock = ['Producto equivocado', 'Cliente cambió opinión'];
      const debeDevolverStock = motivosQueDevuelvenStock.includes(motivo);

      if (debeDevolverStock) {
        for (const item of items_a_devolver) {
          const idPS = Number(item.id_producto_servicio);
          const prodServ = await tx.producto_servicio.findUnique({
            where: { id_producto_servicio: idPS }
          });
          if (prodServ && prodServ.id_producto) {
            await tx.stock.updateMany({
              where: { id_producto: prodServ.id_producto },
              data: {
                cantidad: { increment: Number(item.cantidad) },
                fecha_modificacion: new Date()
              }
            });
          }
        }
      }

      // 5. GENERAR ASIENTO CONTABLE AUTOMÁTICO
      const { registrarAsientoAutomatico } = await import('../utils/asientoAutomatico.utils.js');
      const totalDevolucion = items_a_devolver.reduce((sum, i) => sum + (i.precio_unitario * i.cantidad), 0);
      const montoIva = Math.round(totalDevolucion / 11);
      const montoSinIva = totalDevolucion - montoIva;

      await registrarAsientoAutomatico({
        fecha: new Date(),
        descripcion: `Nota de Crédito Venta Nro: ${notaCredito.nro_nota}`,
        tabla_origen: 'nota_credito_venta',
        id_registro_origen: notaCredito.id_nota_credito_venta,
        detalles: [
          {
            cuenta_codigo: '4.1.01', // Devolución sobre Ventas (reversa la venta) - Usamos la misma cuenta de ventas al DEBE para restar
            monto: montoSinIva,
            debe_haber: true, // DEBE
            glosa: 'Devolución de Ventas'
          },
          {
            cuenta_codigo: '2.1.05', // IVA Débito Fiscal (reversa al DEBE)
            monto: montoIva,
            debe_haber: true, // DEBE
            glosa: 'Reversión IVA Débito Fiscal 10%'
          },
          {
            cuenta_codigo: '1.1.02', // Cuentas a Cobrar / Clientes (reduce la deuda del cliente al HABER)
            monto: totalDevolucion,
            debe_haber: false, // HABER
            glosa: 'Aplicación Nota de Crédito a Cliente'
          }
        ]
      });

      return {
        ...devolucion,
        notaCredito
      };
    });
    res.status(201).json(resultado);
  } catch (error) {
    console.error("Error al procesar devolución venta:", error);
    res.status(400).json({ error: error.message });
  }
};
export const getNotaCredito = async (req, res) => {
      try{
        // creamos la respuesta del json incluyendo el detalle de la nota credito.
        //utilizamos siempre await para las peticiones.
        const notas = await prisma.nota_credito_venta.findMany({
          include: {
            detalle_nota_credito: true,
            devolucion_cliente: {
              include: {
                factura_venta: true
              }
            }
          }
        });
        res.json(notas);
      }
      catch (error) {
        // en el hipotetico caso de que haya errores.
        res.status(500).json({error: error.message});
      }
    }