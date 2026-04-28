import { Router } from 'express';
import { generarFactura,getFactura } from '../controllers/facturaventa.controller.js';

const router = Router();

// Este endpoint procesa la conversión de presupuesto a factura y descuenta stock
router.post('/generar', generarFactura);
router.get('/', getFactura); 

export default router;