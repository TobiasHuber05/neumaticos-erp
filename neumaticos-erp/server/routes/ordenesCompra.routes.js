import express from 'express';
import {
  getOrdenesCompra,
  getOrdenCompraById,
  registrarFactura,
  getFacturas,
  registrarDevolucionCompra,
  getDevoluciones,
  registrarNotaCreditoCompra,
  getNotasCredito,
} from '../controllers/Compras/ordenesCompra.controller.js';
import { requireModulo, verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', requireModulo('compras', 'ver'), getOrdenesCompra);
router.get('/facturas', requireModulo('compras', 'ver'), getFacturas);
router.get('/devoluciones', requireModulo('compras', 'ver'), getDevoluciones);
router.get('/notas-credito', requireModulo('compras', 'ver'), getNotasCredito);
router.get('/:id', requireModulo('compras', 'ver'), getOrdenCompraById);
router.post('/:id/factura', requireModulo('compras', 'editar'), registrarFactura);
router.post('/devolucion', requireModulo('compras', 'editar'), registrarDevolucionCompra);
router.post('/nota-credito', requireModulo('compras', 'editar'), registrarNotaCreditoCompra);

export default router;
