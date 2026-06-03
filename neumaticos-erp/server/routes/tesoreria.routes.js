import express from 'express';
import {
    getBancos,
    getMonedas,
    getCuentas,
    crearCuenta,
    actualizarCuenta,
    eliminarCuenta,
    desactivarCuenta,
    reactivarCuenta,
} from '../controllers/Tesoreria/tesoreria.controller.js';
import { requireModulo, verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/bancos', requireModulo('tesoreria', 'ver'), getBancos);
router.get('/monedas', requireModulo('tesoreria', 'ver'), getMonedas);
router.get('/cuentas', requireModulo('tesoreria', 'ver'), getCuentas);
router.post('/cuentas', requireModulo('tesoreria', 'editar'), crearCuenta);
router.put('/cuentas/:id/desactivar', requireModulo('tesoreria', 'editar'), desactivarCuenta);
router.put('/cuentas/:id/reactivar', requireModulo('tesoreria', 'editar'), reactivarCuenta);
router.put('/cuentas/:id', requireModulo('tesoreria', 'editar'), actualizarCuenta);
router.delete('/cuentas/:id', requireModulo('tesoreria', 'editar'), eliminarCuenta);

export default router;
