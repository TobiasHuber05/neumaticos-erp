import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// --- CONFIGURACIÓN DEL CLIENTE ---
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// POST /api/auth/login
export const login = async (req, res) => {
  const { password } = req.body;
  const identifier = req.body.identifier?.trim();

  console.log("--- INTENTO DE LOGIN ---");
  console.log("Identificador ingresado:", identifier);

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Usuario/Email y contraseña son requeridos' });
  }

  try {
    // Buscamos por username o por email
    const usuario = await prisma.usuarios.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!usuario) {
      console.log("❌ Resultado: El usuario/email no existe en la base de datos.");
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    console.log("✅ Usuario encontrado en DB:", usuario.username || usuario.email);

    // Ajuste a 'passwordd' (con doble d) según el cambio de tu compañero
    const hashAlmacenado = usuario.passwordd || usuario.password;

    if (!hashAlmacenado) {
      console.log("❌ Error: No se encontró hash de contraseña para este usuario.");
      return res.status(500).json({ error: 'Error en la estructura de datos del usuario' });
    }

    const passwordValido = await bcrypt.compare(password, hashAlmacenado);
    console.log("¿La contraseña coincide?:", passwordValido);

    if (!passwordValido) {
      console.log("❌ Resultado: Contraseña incorrecta.");
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar Token
    console.log("🚀 Login exitoso, generando token...");
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        username: usuario.username || '',
        rol: usuario.rol_empresa || usuario.rol 
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
        rol: usuario.rol_empresa || usuario.rol,
        permisos: usuario.permisos || {}
      }
    });

  } catch (error) {
    console.error('❌ Error crítico en el servidor:', error);
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
        passwordd: passwordHash, // Guardamos en passwordd
        rol_empresa: rol         // Guardamos en rol_empresa
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
    console.error('❌ Error en register:', error);
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
        rol_empresa: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ usuario });

  } catch (error) {
    console.error('❌ Error en perfil:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/auth/usuarios
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
    console.error('❌ Error al listar usuarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};