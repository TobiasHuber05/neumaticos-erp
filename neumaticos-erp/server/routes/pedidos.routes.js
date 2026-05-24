import { Router } from 'express';
import { getPedidos, createPedido } from '../controllers/pedidos.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/pedidos', getPedidos);
router.post('/pedidos', createPedido);

export default router;
