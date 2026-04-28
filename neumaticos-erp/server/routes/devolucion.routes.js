import { Router } from 'express';
import { procesarDevolucion } from '../controllers/devolucion.controller.js';

const router = Router();

// Maneja la devolución (48hs), nota de crédito y reposición de stock
router.post('/', procesarDevolucion);

export default router;