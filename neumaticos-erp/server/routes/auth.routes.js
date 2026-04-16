import express from 'express';
import { login, register, perfil } from '../controllers/auth.controller.js';
import { verifyToken, verifyRol } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register → solo admin
router.post('/register', verifyToken, verifyRol('admin'), register);

// GET /api/auth/perfil
router.get('/perfil', verifyToken, perfil);

export default router;