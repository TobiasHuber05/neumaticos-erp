//@88gonzalex
import { prisma } from '../lib/prisma.js';

// Obtener todos los clientes
export const getClientes = async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los clientes" });
  }
};

// Obtener un cliente por ID
export const getClienteById = async (req, res) => {
  const { id } = req.params;
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: parseInt(id) }
    });
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar el cliente" });
  }
};

// Crear un nuevo cliente (Requerido para Presupuestos y Facturas)
export const createCliente = async (req, res) => {
  const { nombre, apellido, ruc, fecha_nacimiento, email } = req.body;
  try {
    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        apellido,
        ruc, // Puede ser CI o RUC según el documento
        fecha_nacimiento: new Date(fecha_nacimiento),
        email
      }
    });
    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(400).json({ error: "Error al crear el cliente", detalle: error.message });
  }
};

// Actualizar datos del cliente
export const updateCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, ruc, fecha_nacimiento, email } = req.body;
  try {
    const clienteActualizado = await prisma.cliente.update({
      where: { id_cliente: parseInt(id) },
      data: {
        nombre,
        apellido,
        ruc,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined,
        email
      }
    });
    res.json(clienteActualizado);
  } catch (error) {
    res.status(400).json({ error: "Error al actualizar el cliente" });
  }
};

// Eliminar un cliente
export const deleteCliente = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.cliente.delete({
      where: { id_cliente: parseInt(id) }
    });
    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    res.status(400).json({ error: "No se puede eliminar el cliente (posiblemente tiene facturas asociadas)" });
  }
};
