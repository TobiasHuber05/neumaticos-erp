import express from 'express';
import {
    getBancos,
    getMonedas,
    getCuentas,
    crearCuenta,
    actualizarCuenta,
} from '../controllers/Tesoreria/tesoreria.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/bancos', getBancos);                        // GET  /api/tesoreria/bancos
router.get('/monedas', getMonedas);                      // GET  /api/tesoreria/monedas
router.get('/cuentas', getCuentas);                      // GET  /api/tesoreria/cuentas
router.post('/cuentas', crearCuenta);                    // POST /api/tesoreria/cuentas
router.put('/cuentas/:id', actualizarCuenta);            // PUT  /api/tesoreria/cuentas/:id

export default router;
