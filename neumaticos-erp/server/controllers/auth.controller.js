import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// POST /api/auth/login
export const login = async (req, res) => {
  const { password } = req.body;
  const identifier = req.body.identifier?.trim();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Usuario/Email y contraseña son requeridos' });
  }

  try {
    const usuario = await prisma.usuarios.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const hashAlmacenado = usuario.passwordd || usuario.password;
    if (!hashAlmacenado) {
      return res.status(500).json({ error: 'Error en la estructura de datos del usuario' });
    }

    const passwordValido = await bcrypt.compare(password, hashAlmacenado);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Asegurar que el usuario tiene un rol válido
    let rolUsuario = usuario.rol_empresa || usuario.rol || 'USER';
    let permisosUsuario = usuario.permisos || {};

    // Si no tiene permisos y tiene rol, calcular permisos por defecto
    if (Object.keys(permisosUsuario).length === 0) {
      const { getPermisosBaseCargo } = await import('../utils/permisosServidor.js');
      permisosUsuario = getPermisosBaseCargo(rolUsuario);
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        username: usuario.username || '',
        rol: rolUsuario
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        username: usuario.username || '',
        email: usuario.email,
        rol: rolUsuario,
        permisos: permisosUsuario
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/auth/register (solo admin)
export const register = async (req, res) => {
  const { password, rol } = req.body;
  const username = req.body.username?.trim();
  const email = req.body.email?.trim();

  if (!username || !email || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const existe = await prisma.usuarios.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existe) {
      return res.status(409).json({ error: 'El email o username ya está en uso' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        username,
        email,
        passwordd: passwordHash,
        rol_empresa: rol
      }
    });

    return res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: {
        id_usuario: nuevoUsuario.id_usuario,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol_empresa
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/auth/perfil
export const perfil = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: req.usuario.id_usuario },
      select: {
        id_usuario: true,
        username: true,
        email: true,
        rol_empresa: true,
        permisos: true,
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      usuario: {
        id_usuario: usuario.id_usuario,
        username: usuario.username || '',
        email: usuario.email,
        rol: usuario.rol_empresa,
        permisos: usuario.permisos || {},
      },
    });
  } catch (error) {
    console.error('Error en perfil:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/auth/usuarios (solo admin)
export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany({
      select: {
        id_usuario: true,
        username: true,
        email: true,
        rol_empresa: true
      },
      orderBy: { id_usuario: 'asc' }
    });
    return res.json(usuarios);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/auth/change-password (el usuario cambia su propia contraseña)
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: req.usuario.id_usuario }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const hashAlmacenado = usuario.passwordd || usuario.password;
    const passwordValido = await bcrypt.compare(oldPassword, hashAlmacenado);

    if (!passwordValido) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.usuarios.update({
      where: { id_usuario: req.usuario.id_usuario },
      data: { passwordd: newPasswordHash }
    });

    return res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/auth/reset-password-admin (solo admin, resetea contraseña de cualquier usuario)
export const resetPasswordAdmin = async (req, res) => {
  const { id_usuario, newPassword } = req.body;

  if (!id_usuario || !newPassword) {
    return res.status(400).json({ error: 'ID de usuario y nueva contraseña son requeridos' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: Number(id_usuario) },
      include: { cargos: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Asegurar que el usuario tenga un cargo/rol. Si no tiene, usar el nombre del cargo
    const rol_empresa = usuario.rol_empresa || usuario.cargos?.nombre_cargo || 'USER';
    
    // Si no tiene permisos y tiene un cargo, asignar permisos por defecto
    let permisos = usuario.permisos;
    if (!permisos || Object.keys(permisos).length === 0) {
      // Importar la función para obtener permisos base
      const { getPermisosBaseCargo } = await import('../utils/permisosServidor.js');
      permisos = getPermisosBaseCargo(rol_empresa);
    }

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id_usuario: Number(id_usuario) },
      data: { 
        passwordd: newPasswordHash,
        rol_empresa: rol_empresa,
        permisos: permisos
      }
    });

    console.log(`✓ Contraseña reseteada para usuario ${usuario.username} (ID: ${id_usuario}) con rol: ${rol_empresa}`);

    return res.json({ 
      message: `Contraseña de ${usuario.username} reseteada exitosamente`,
      username: usuario.username,
      id_usuario: usuario.id_usuario,
      rol: rol_empresa
    });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};