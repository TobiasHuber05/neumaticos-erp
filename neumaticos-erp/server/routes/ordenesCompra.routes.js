import express from 'express';
import {
  getOrdenesCompra,
  getOrdenCompraById,
  registrarFactura,
  getFacturas,
} from '../controllers/ordenesCompra.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getOrdenesCompra);                  // GET  /api/ordenes-compra
router.get('/facturas', getFacturas);               // GET  /api/ordenes-compra/facturas
router.get('/:id', getOrdenCompraById);             // GET  /api/ordenes-compra/:id
router.post('/:id/factura', registrarFactura);      // POST /api/ordenes-compra/:id/factura

export default router;