import { Router } from 'express';
import { generarFactura } from '../controllers/facturaventa.controller.js';

const router = Router();

// Este endpoint procesa la conversión de presupuesto a factura y descuenta stock
router.post('/generar', generarFactura);

export default router;