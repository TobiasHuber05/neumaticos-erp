import { Router } from 'express';
import {
    getLibroDiario,
    getLibroMayor,
    getSumasSaldos
} from '../controllers/Contabilidad/reportesContables.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/libro-diario', getLibroDiario);
router.get('/libro-mayor', getLibroMayor);
router.get('/sumas-saldos', getSumasSaldos);

export default router;
