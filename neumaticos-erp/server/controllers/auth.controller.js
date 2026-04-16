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
  const { email, password } = req.body;

  // LOG DE DEPURACIÓN 1: Ver qué llega del navegador
  console.log("--- INTENTO DE LOGIN ---");
  console.log("Email ingresado:", email);
  console.log("Password ingresada:", password);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { email }
    });

    // LOG DE DEPURACIÓN 2: Ver si encontramos al usuario en la DB
    if (!usuario) {
      console.log("❌ Resultado: El email no existe en la base de datos.");
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    console.log("✅ Usuario encontrado en DB:", usuario.email);
    console.log("Hash almacenado en DB:", usuario.password);

    if (!usuario.activo) {
      console.log("⚠️ Usuario encontrado pero está INACTIVO.");
      return res.status(403).json({ error: 'Usuario inactivo. Contactá al administrador' });
    }

    // LOG DE DEPURACIÓN 3: Comparar contraseñas
    const passwordValido = await bcrypt.compare(password, usuario.password);
    console.log("¿La contraseña coincide con el hash?:", passwordValido);

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
        username: usuario.username,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('❌ Error crítico en el servidor:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/auth/register (solo admin)
export const register = async (req, res) => {
  const { username, email, password, rol } = req.body;

  if (!username || !email || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const rolesValidos = ['admin', 'compras', 'ventas', 'tesoreria', 'rrhh', 'contabilidad'];
  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({ error: `Rol inválido. Opciones: ${rolesValidos.join(', ')}` });
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
        password: passwordHash, 
        rol,
        activo: true 
      }
    });

    return res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: {
        id_usuario: nuevoUsuario.id_usuario,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
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
        rol: true,
        activo: true,
        created_at: true
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