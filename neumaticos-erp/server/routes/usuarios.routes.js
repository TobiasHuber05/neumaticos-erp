import express from 'express';
import {
  getUsuarios,
  getCargos,
  createUsuario,
  updateUsuario,
  deleteUsuario
} from '../controllers/usuarios.controller.js';
import { verifyToken, verifyRol } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rutas de administración de usuarios (Protegidas)
// Puedes añadir verifyRol('ADMIN') si quieres que solo el ADMIN acceda
router.get('/usuarios', verifyToken, getUsuarios);
router.post('/usuarios', verifyToken, createUsuario);
router.put('/usuarios/:id', verifyToken, updateUsuario);
router.delete('/usuarios/:id', verifyToken, deleteUsuario);

// Ruta para obtener los cargos al crear/editar
router.get('/cargos', verifyToken, getCargos);

export default router;
