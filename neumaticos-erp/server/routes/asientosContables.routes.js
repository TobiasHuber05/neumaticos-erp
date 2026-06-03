import { Router } from 'express';
import { getAsientosContables, createAsientoContable, getDetalleOrigenAsiento } from '../controllers/Contabilidad/asientosContables.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', getAsientosContables);
router.post('/', createAsientoContable);
router.get('/:id/detalle-origen', getDetalleOrigenAsiento);

export default router;
