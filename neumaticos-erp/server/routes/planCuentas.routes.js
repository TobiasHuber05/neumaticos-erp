import express from 'express';
import {
    getPlanCuentas,
    getTodasCuentas,
    createCuenta,
    updateCuenta,
    deleteCuenta,
} from '../controllers/Contabilidad/planCuentas.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/plan-cuentas/todas', getTodasCuentas);     // GET  /api/contabilidad/plan-cuentas/todas
router.get('/plan-cuentas', getPlanCuentas);             // GET  /api/contabilidad/plan-cuentas
router.post('/plan-cuentas', createCuenta);              // POST /api/contabilidad/plan-cuentas
router.put('/plan-cuentas/:id', updateCuenta);           // PUT  /api/contabilidad/plan-cuentas/:id
router.delete('/plan-cuentas/:id', deleteCuenta);        // DELETE /api/contabilidad/plan-cuentas/:id

export default router;