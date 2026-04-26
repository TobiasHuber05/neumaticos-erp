import express from 'express';
import {
    getMovimientos,
    registrarMovimiento,
    confirmarMovimientos,
    getEstadisticasTesoreria,
} from '../controllers/movimientos.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getMovimientos);                        // GET  /api/movimientos-bancarios
router.post('/', registrarMovimiento);                  // POST /api/movimientos-bancarios
router.put('/confirmar', confirmarMovimientos);         // PUT  /api/movimientos-bancarios/confirmar
router.get('/estadisticas', getEstadisticasTesoreria);  // GET  /api/movimientos-bancarios/estadisticas

export default router;
