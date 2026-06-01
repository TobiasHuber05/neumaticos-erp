import { Router } from 'express';
import {
    getConceptosBase, createConcepto,
    getProcesos, createProceso, getProcesoById,
    cerrarProceso, getRecibos, createAdelanto
} from '../controllers/Personal/salarios.controller.js';

const router = Router();
router.get('/salarios/conceptos', getConceptosBase);
router.post('/salarios/conceptos', createConcepto);
router.get('/salarios/procesos', getProcesos);
router.post('/salarios/procesos', createProceso);
router.post('/salarios/adelantos', createAdelanto);
router.get('/salarios/procesos/:id', getProcesoById);
router.post('/salarios/procesos/:id/cerrar', cerrarProceso);
router.get('/salarios/procesos/:id/recibos', getRecibos);
export default router;