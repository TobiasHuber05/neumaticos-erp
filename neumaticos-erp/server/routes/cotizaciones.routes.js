import express from 'express';
import {
  getCotizaciones,
  getCotizacionesPorPedido,
  generarCotizaciones,
  actualizarPrecios,
  adjudicar,
} from '../controllers/cotizaciones.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getCotizaciones);                           // GET  /api/cotizaciones
router.get('/pedido/:idPedido', getCotizacionesPorPedido); // GET  /api/cotizaciones/pedido/:idPedido
router.post('/generar', generarCotizaciones);              // POST /api/cotizaciones/generar
router.put('/:id/precios', actualizarPrecios);             // PUT  /api/cotizaciones/:id/precios
router.post('/adjudicar', adjudicar);                      // POST /api/cotizaciones/adjudicar

export default router;