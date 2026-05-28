import express from 'express';
import {
  getOrdenesCompra,
  getOrdenCompraById,
  registrarFactura,
  getFacturas,
  registrarDevolucionCompra,
  getDevoluciones,
  registrarNotaCreditoCompra,
  getNotasCredito,
} from '../controllers/Compras/ordenesCompra.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getOrdenesCompra);                  // GET  /api/ordenes-compra
router.get('/facturas', getFacturas);               // GET  /api/ordenes-compra/facturas
router.get('/devoluciones', getDevoluciones);       // GET  /api/ordenes-compra/devoluciones
router.get('/notas-credito', getNotasCredito);       // GET  /api/ordenes-compra/notas-credito
router.get('/:id', getOrdenCompraById);             // GET  /api/ordenes-compra/:id
router.post('/:id/factura', registrarFactura);      // POST /api/ordenes-compra/:id/factura
router.post('/devolucion', registrarDevolucionCompra); // POST /api/ordenes-compra/devolucion
router.post('/nota-credito', registrarNotaCreditoCompra); // POST /api/ordenes-compra/nota-credito

export default router;