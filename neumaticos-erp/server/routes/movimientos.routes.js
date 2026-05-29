import express from 'express';
import {
    getMovimientos,
    registrarMovimiento,
    confirmarMovimientos,
    getEstadisticasTesoreria,
} from '../controllers/Tesoreria/movimientos.controller.js';
import { requireModulo, verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', requireModulo('tesoreria', 'ver'), getMovimientos);
router.post('/', requireModulo('tesoreria', 'editar'), registrarMovimiento);
router.put('/confirmar', requireModulo('tesoreria', 'editar'), confirmarMovimientos);
router.get('/estadisticas', requireModulo('tesoreria', 'ver'), getEstadisticasTesoreria);

export default router;
