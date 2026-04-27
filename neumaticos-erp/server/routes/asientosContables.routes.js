import { Router } from 'express';
import { getAsientosContables, createAsientoContable } from '../controllers/asientosContables.controller.js';

const router = Router();

router.get('/', getAsientosContables);
router.post('/', createAsientoContable);

export default router;
