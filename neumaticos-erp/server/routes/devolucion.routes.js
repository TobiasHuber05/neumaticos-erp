import { Router } from 'express';
import { getNotaCredito, procesarDevolucion } from '../controllers/Ventas/devolucion.controller.js';

const router = Router();

router.get('/', getNotaCredito); // obtener notas creditos
router.post('/', procesarDevolucion); // procesar devoluciones

export default router;