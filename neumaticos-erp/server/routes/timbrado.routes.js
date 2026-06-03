import { Router } from 'express';
import { 
  getTimbrados, 
  getTimbradoById, 
  crearTimbrado, 
  actualizarTimbrado, 
  obtenerEstadoTimbrado,
  agregarPuntoExpedicion,
  togglePuntoExpedicion
} from '../controllers/Ventas/timbrado.controller.js';

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

// Agregar punto de expedición a un timbrado
router.post('/:id/puntos', agregarPuntoExpedicion);

// Activar/desactivar un punto de expedición
router.put('/:id/puntos/:puntoId/toggle', togglePuntoExpedicion);

export default router;

