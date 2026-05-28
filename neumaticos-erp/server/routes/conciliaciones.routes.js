import express from 'express';
import {
    getConciliaciones,
    getConciliacionById,
    crearConciliacion,
    vincularMovimientos,
    finalizarConciliacion
} from '../controllers/Tesoreria/conciliaciones.controller.js';

const router = express.Router();

router.get('/', getConciliaciones);
router.get('/:id', getConciliacionById);
router.post('/', crearConciliacion);
router.post('/:id/vincular', vincularMovimientos);
router.patch('/:id/finalizar', finalizarConciliacion);

export default router;
