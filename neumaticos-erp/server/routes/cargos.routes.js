import { Router } from 'express';
import { getCargos, getCargoById, createCargo, updateCargo, deleteCargo } from '../controllers/Personal/cargos.controller.js';

const router = Router();
router.get('/cargos', getCargos);
router.get('/cargos/:id', getCargoById);
router.post('/cargos', createCargo);
router.put('/cargos/:id', updateCargo);
router.delete('/cargos/:id', deleteCargo);
export default router;

