import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

// Obtener todos los usuarios con su cargo
export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany({
      include: {
        cargos: true,
      },
      orderBy: { id_usuario: 'asc' },
    });
    // Ocultar contraseñas
    const usuariosSeguros = usuarios.map(u => {
      const { passwordd, ...resto } = u;
      return resto;
    });
    res.json(usuariosSeguros);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Obtener todos los cargos disponibles
export const getCargos = async (req, res) => {
  try {
    const cargos = await prisma.cargos.findMany({
      orderBy: { id_cargo: 'asc' },
    });
    res.json(cargos);
  } catch (error) {
    console.error('Error al obtener cargos:', error);
    res.status(500).json({ error: 'Error al obtener cargos' });
  }
};

// Crear usuario
export const createUsuario = async (req, res) => {
  try {
    const { username, email, telefono, direccion, id_cargo, permisos, password } = req.body;
    
    // Verificar si ya existe
    const existe = await prisma.usuarios.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existe) {
      return res.status(409).json({ error: 'El email o username ya está en uso' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || '123456', salt);

    const cargo = await prisma.cargos.findUnique({ where: { id_cargo: parseInt(id_cargo) } });

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        username,
        email,
        telefono,
        direccion,
        id_cargo: parseInt(id_cargo),
        rol_empresa: cargo?.nombre_cargo || null,
        permisos,
        passwordd: passwordHash,
      },
      include: {
        cargos: true,
      },
    });

    const { passwordd, ...resto } = nuevoUsuario;
    res.status(201).json(resto);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar usuario
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, telefono, direccion, id_cargo, permisos } = req.body;
    
    const cargo = await prisma.cargos.findUnique({ where: { id_cargo: parseInt(id_cargo) } });

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id_usuario: parseInt(id) },
      data: {
        username,
        email,
        telefono,
        direccion,
        id_cargo: parseInt(id_cargo),
        rol_empresa: cargo?.nombre_cargo || null,
        permisos,
      },
      include: {
        cargos: true,
      },
    });

    const { passwordd, ...resto } = usuarioActualizado;
    res.json(resto);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Eliminar usuario
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.usuarios.delete({
      where: { id_usuario: parseInt(id) },
    });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
