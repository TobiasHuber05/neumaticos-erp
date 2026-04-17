import { Router } from 'express';
import { getPedidos, createPedido } from '../controllers/pedidos.controller.js';

const router = Router();

router.get('/pedidos', getPedidos);
router.post('/pedidos', createPedido);

export default router;