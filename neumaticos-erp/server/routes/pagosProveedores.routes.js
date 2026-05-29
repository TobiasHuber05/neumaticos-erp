import express from 'express';
import {
  getPagos,
  getFormasPago,
  registrarPago,
} from '../controllers/Compras/pagosProveedores.controller.js';
import { requireModulo, verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', requireModulo('compras', 'ver'), getPagos);
router.get('/formas-pago', requireModulo('compras', 'ver'), getFormasPago);
router.post('/', requireModulo('compras', 'editar'), registrarPago);

export default router;
