import express from 'express';
import { login, register, perfil, changePassword, resetPasswordAdmin } from '../controllers/auth.controller.js';
import { verifyToken, verifyRol } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register → solo admin
router.post('/register', verifyToken, verifyRol('admin'), register);

// GET /api/auth/perfil
router.get('/perfil', verifyToken, perfil);

// GET /api/auth/usuarios -> solo admin
router.get('/usuarios', verifyToken, verifyRol('admin'), async (req, res) => {
  const { listarUsuarios } = await import('../controllers/auth.controller.js');
  listarUsuarios(req, res);
});

// POST /api/auth/change-password → requiere token JWT (usuario cambia su propia contraseña)
router.post('/change-password', verifyToken, changePassword);

// POST /api/auth/reset-password-admin → solo admin (admin resetea contraseña de cualquier usuario)
router.post('/reset-password-admin', verifyToken, verifyRol('admin'), resetPasswordAdmin);

export default router;