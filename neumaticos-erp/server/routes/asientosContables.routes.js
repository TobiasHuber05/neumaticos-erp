import { Router } from 'express';
import { getAsientosContables, createAsientoContable, getDetalleOrigenAsiento } from '../controllers/asientosContables.controller.js';

const router = Router();

router.get('/', getAsientosContables);
router.post('/', createAsientoContable);
router.get('/:id/detalle-origen', getDetalleOrigenAsiento);

export default router;
