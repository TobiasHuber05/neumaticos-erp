import { Router } from 'express';
import { getAsientosCompras } from '../controllers/asientos.controller.js';
const router = Router();

router.get('/asientos-compras', getAsientosCompras);

export default router;