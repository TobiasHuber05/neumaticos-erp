import express from 'express';
import {
    getConciliaciones,
    getConciliacionById,
    crearConciliacion,
    vincularMovimientos,
    finalizarConciliacion
} from '../controllers/Tesoreria/conciliaciones.controller.js';
import { requireModulo, verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', requireModulo('tesoreria', 'ver'), getConciliaciones);
router.get('/:id', requireModulo('tesoreria', 'ver'), getConciliacionById);
router.post('/', requireModulo('tesoreria', 'editar'), crearConciliacion);
router.post('/:id/vincular', requireModulo('tesoreria', 'editar'), vincularMovimientos);
router.patch('/:id/finalizar', requireModulo('tesoreria', 'editar'), finalizarConciliacion);

export default router;
