import express from 'express';
import {
  getPagos,
  getFormasPago,
  registrarPago,
} from '../controllers/Compras/pagosProveedores.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getPagos);                    // GET  /api/pagos-proveedores
router.get('/formas-pago', getFormasPago);    // GET  /api/pagos-proveedores/formas-pago
router.post('/', registrarPago);              // POST /api/pagos-proveedores

export default router;