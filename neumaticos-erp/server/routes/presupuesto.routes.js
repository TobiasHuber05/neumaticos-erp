import { Router } from 'express';
import { 
    crearPresupuesto, 
    obtenerPresupuestos 
} from '../controllers/presupuesto.controller.js';

const router = Router();

// Según requerimiento: Registro de productos/servicios y datos del cliente
router.post('/', crearPresupuesto);
router.get('/', obtenerPresupuestos);

export default router;