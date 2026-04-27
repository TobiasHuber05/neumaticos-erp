import { Router } from 'express';
import { 
    getPeriodosContables, 
    createPeriodoContable, 
    cerrarPeriodoContable 
} from '../controllers/periodosContables.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', getPeriodosContables);
router.post('/', createPeriodoContable);
router.put('/:id/cerrar', cerrarPeriodoContable);

export default router;
