import express from 'express';
import {
  getCotizaciones,
  getCotizacionesPorPedido,
  generarCotizaciones,
  actualizarPrecios,
  adjudicar,
} from '../controllers/Compras/cotizaciones.controller.js';
import { requireModulo, verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', requireModulo('compras', 'ver'), getCotizaciones);
router.get('/pedido/:idPedido', requireModulo('compras', 'ver'), getCotizacionesPorPedido);
router.post('/generar', requireModulo('compras', 'editar'), generarCotizaciones);
router.put('/:id/precios', requireModulo('compras', 'editar'), actualizarPrecios);
router.post('/adjudicar', requireModulo('compras', 'editar'), adjudicar);

export default router;
