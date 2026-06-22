import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { puedeAccederModulo } from '../utils/permisosServidor.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

export const requireModulo = (moduloId, accion = 'ver') => {
  return async (req, res, next) => {
    try {
      if (!req.usuario?.id_usuario) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const usuario = await prisma.usuarios.findUnique({
        where: { id_usuario: req.usuario.id_usuario },
        select: {
          id_usuario: true,
          username: true,
          rol_empresa: true,
          permisos: true,
        },
      });

      if (!usuario) {
        return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
      }

      const puedeAcceder = puedeAccederModulo(usuario, moduloId, accion);
      
      if (!puedeAcceder) {
        console.warn(`⚠️ Acceso denegado: ${usuario.username} (ID: ${usuario.id_usuario}) - Módulo: ${moduloId} - Rol: ${usuario.rol_empresa}`);
        return res.status(403).json({ error: 'No tenés permisos para esta acción' });
      }

      req.usuarioActual = usuario;
      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
};

export const verifyRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rolUsuario = (req.usuario.rol || '').toUpperCase();
    const rolesEnMayuscula = rolesPermitidos.map(r => r.toUpperCase());

    // El ADMIN siempre tiene permiso, o si el rol está en la lista permitida
    if (rolUsuario === 'ADMIN' || rolesEnMayuscula.includes(rolUsuario)) {
      return next();
    }

    return res.status(403).json({ error: 'No tenés permisos para esta acción' });
  };
};
