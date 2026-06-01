import { Router } from 'express';
import {
    getReporteFacturas,
    getKpisVentas,
    getClientesLista,
} from '../controllers/Reportes/reportesVentas.controller.js';

const router = Router();

// GET /api/reportes-ventas/facturas
// Query params: fechaDesde, fechaHasta, clienteId, estadoCobro
router.get('/facturas', getReporteFacturas);

// GET /api/reportes-ventas/kpis
// Query params: fechaDesde, fechaHasta, clienteId
router.get('/kpis', getKpisVentas);

// GET /api/reportes-ventas/clientes-lista
router.get('/clientes-lista', getClientesLista);

export default router;