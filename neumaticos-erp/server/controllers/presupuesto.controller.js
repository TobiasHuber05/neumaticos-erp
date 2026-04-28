import { prisma } from '../lib/prisma.js';

export const crearPresupuesto = async (req, res) => {
  const { id_cliente, items } = req.body; 
  // items: [{ id_producto_servicio, cantidad_producto, precio_unitario }]

  try {
    const fechaEmision = new Date();
    const fechaVencimiento = new Date();
    // El presupuesto tiene una validez de 10 días hábiles 
    fechaVencimiento.setDate(fechaEmision.getDate() + 10); 

    const nuevoPresupuesto = await prisma.presupuesto.create({
      data: {
        id_cliente,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
        estado: "Vigente",
        total: items.reduce((acc, item) => acc + (item.cantidad_producto * item.precio_unitario), 0),
        detalle_presupuesto: {
          create: items.map(item => ({
            id_producto_servicio: item.id_producto_servicio,
            cantidad_producto: item.cantidad_producto,
            precio_unitario: item.precio_unitario
          }))
        }
      },
      include: {
        cliente: true, // Incluye: Nombre, apellido, RUC, fecha nacimiento, correo 
        detalle_presupuesto: true
      }
    });

    res.status(201).json(nuevoPresupuesto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const obtenerPresupuestos = async (req, res) => {
  try {
    const lista = await prisma.presupuesto.findMany({ include: { cliente: true } });
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};