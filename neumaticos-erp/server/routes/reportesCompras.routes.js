import { Router } from 'express';
import {
    getReporteOrdenes,
    getKpis,
    getProveedoresLista,
} from '../controllers/Reportes/reportesCompras.controller.js';

const router = Router();

// GET /api/reportes-compras/ordenes
// Query params: fechaDesde, fechaHasta, proveedorId, estadoPago
router.get('/ordenes', getReporteOrdenes);

// GET /api/reportes-compras/kpis
// Query params: fechaDesde, fechaHasta, proveedorId
router.get('/kpis', getKpis);

// GET /api/reportes-compras/proveedores-lista
router.get('/proveedores-lista', getProveedoresLista);

export default router;
