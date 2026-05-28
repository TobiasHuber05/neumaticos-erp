import { prisma } from '../../lib/prisma.js';

export const generarFactura = async (req, res) => {
  const { id_presupuesto, nro_factura, timbrado, contado_credito } = req.body;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener presupuesto y validar vigencia de 10 días 
      const presupuesto = await tx.presupuesto.findUnique({
        where: { id_presupuesto },
        include: {
          detalle_presupuesto: {
            include: {
              producto: {
                include: { producto_servicio: true }
              }
            }
          }
        }
      });

      if (!presupuesto || new Date() > new Date(presupuesto.fecha_vencimiento)) {
        throw new Error("Presupuesto inexistente o vencido (máx 10 días hábiles) ");
      }

      // Bloquear si ya fue convertido en factura
      if (presupuesto.estado === 'Convertido') {
        throw new Error('Este presupuesto ya fue convertido en factura. No se puede facturar dos veces.');
      }

      // Validar que todos los productos tengan su entrada en producto_servicio
      for (const d of presupuesto.detalle_presupuesto) {
        if (!d.producto?.producto_servicio || d.producto.producto_servicio.length === 0) {
          // Si no existe, lo creamos para que no falle la factura
          const nuevoProdServ = await tx.producto_servicio.create({
            data: { id_producto: d.id_producto, estado: 'Activo', tipo_iva: '10%' }
          });
          d.producto.producto_servicio = [nuevoProdServ];
        }
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
              id_producto_servicio: d.producto.producto_servicio[0].id_producto_servicio,
              cantidad: d.cantidad_producto,
              precio_unitario: d.precio_unitario,
              subtotal: Number(d.cantidad_producto) * Number(d.precio_unitario),
              total: Number(d.cantidad_producto) * Number(d.precio_unitario)
            }))
          }
        },
        include: { detalle_factura_venta: true }
      });

      // 3. Descontar del stock correspondiente 
      for (const item of factura.detalle_factura_venta) {
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

      // Marcar el presupuesto como Convertido para que no se pueda volver a facturar
      await tx.presupuesto.update({
        where: { id_presupuesto },
        data: { estado: 'Convertido' }
      });
      // 4. GENERAR ASIENTO CONTABLE AUTOMÁTICO
      // Importamos dinámicamente para evitar problemas de dependencias circulares si los hubiera
      const { registrarAsientoAutomatico } = await import('../../utils/asientoAutomatico.utils.js');

      const totalFactura = Number(factura.total);
      const montoIva = Math.round(totalFactura / 11); // IVA 10% incluido
      const montoSinIva = totalFactura - montoIva;

      await registrarAsientoAutomatico({
        fecha: new Date(),
        descripcion: `Venta Factura Nro: ${nro_factura}`,
        tabla_origen: 'factura_venta',
        id_registro_origen: factura.id_factura_venta,
        detalles: [
          {
            cuenta_codigo: '1.1.02', // Cuentas a Cobrar / Clientes
            monto: totalFactura,
            debe_haber: true, // DEBE
            glosa: 'Clientes por Ventas'
          },
          {
            cuenta_codigo: '4.1.01', // Ventas de Mercaderías
            monto: montoSinIva,
            debe_haber: false, // HABER
            glosa: 'Ventas gravadas al 10%'
          },
          {
            cuenta_codigo: '2.1.05', // IVA Débito Fiscal
            monto: montoIva,
            debe_haber: false, // HABER
            glosa: 'IVA Débito Fiscal 10%'
          }
        ]
      });

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
      include: {
        detalle_factura_venta: true,
        devolucion_cliente: {
          include: {
            detalle_devolucion: true
          }
        }
      }
    });
    res.json(facturas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
