import { Router } from 'express';
import { getAsientosCompras, getAsientosNomina, createAsiento, getAsientosVentas } from '../controllers/Contabilidad/asientos.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/asientos-compras', getAsientosCompras);
router.get('/asientos-ventas', getAsientosVentas);
router.get('/asientos-nomina', getAsientosNomina);
router.post('/asientos', createAsiento);

export default router;
