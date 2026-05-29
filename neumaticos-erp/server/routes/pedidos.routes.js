import { Router } from 'express';
import { getPedidos, createPedido } from '../controllers/Compras/pedidos.controller.js';
import { requireModulo, verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/pedidos', requireModulo('compras', 'ver'), getPedidos);
router.post('/pedidos', requireModulo('compras', 'editar'), createPedido);

export default router;
