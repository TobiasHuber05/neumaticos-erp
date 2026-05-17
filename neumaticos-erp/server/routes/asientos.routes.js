import { Router } from 'express';
import { getAsientosCompras, getAsientosNomina, createAsiento, getAsientosVentas } from '../controllers/asientos.controller.js';

const router = Router();
router.get('/asientos-compras', getAsientosCompras);
router.get('/asientos-ventas', getAsientosVentas);
router.get('/asientos-nomina', getAsientosNomina);
router.post('/asientos', createAsiento);

export default router;