import { Router } from 'express';
import { getTimbrados, getTimbradoById, crearTimbrado, actualizarTimbrado, obtenerEstadoTimbrado } from '../controllers/Ventas/timbrado.controller.js';

const router = Router();

// Obtener todos los timbrados
router.get('/', getTimbrados);

// Obtener un timbrado por ID
router.get('/:id', getTimbradoById);

// Obtener estado/estadísticas de un timbrado
router.get('/:id/estado', obtenerEstadoTimbrado);

// Crear nuevo timbrado
router.post('/', crearTimbrado);

// Actualizar timbrado (estado, fecha vencimiento)
router.put('/:id', actualizarTimbrado);

export default router;
