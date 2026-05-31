import { Router } from 'express';
import {
    getMovimientos,
    getKpis,
    getProductosLista,
} from '../controllers/Reportes/reportesStock.controller.js';

const router = Router();

router.get('/movimientos', getMovimientos);
router.get('/kpis', getKpis);
router.get('/productos-lista', getProductosLista);

export default router;
