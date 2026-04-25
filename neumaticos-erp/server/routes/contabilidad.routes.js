import { Router } from 'express';
import {
  getPeriodos,
  createPeriodo,
  closePeriodo,
  getPlanCuentas,
  createCuenta,
  getAsientos,
  createAsientoManual,
  getLibroDiario,
  getLibroMayor,
  getBalanceSumasSaldos
} from '../controllers/contabilidad.controller.js';

const router = Router();

// Periodos
router.get('/periodos', getPeriodos);
router.post('/periodos', createPeriodo);
router.put('/periodos/:id/cerrar', closePeriodo);

// Plan de Cuentas
router.get('/plan-cuentas', getPlanCuentas);
router.post('/plan-cuentas', createCuenta);

// Asientos
router.get('/asientos', getAsientos);
router.post('/asientos/manual', createAsientoManual);

// Reportes
router.get('/reportes/libro-diario', getLibroDiario);
router.get('/reportes/libro-mayor', getLibroMayor);
router.get('/reportes/balance-sumas-saldos', getBalanceSumasSaldos);

export default router;
