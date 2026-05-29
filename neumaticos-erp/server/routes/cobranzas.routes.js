import express from 'express';
import { getCobranzas, registrarCobro } from '../controllers/Ventas/cobranzas.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getCobranzas);
router.post('/', registrarCobro);

export default router;
