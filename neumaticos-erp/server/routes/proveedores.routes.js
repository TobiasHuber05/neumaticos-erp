import express from 'express';
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  getCategorias
} from '../controllers/Compras/proveedores.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren token
router.use(verifyToken);

router.get('/categorias', getCategorias);   // GET /api/proveedores/categorias
router.get('/', getProveedores);            // GET /api/proveedores
router.get('/:id', getProveedorById);       // GET /api/proveedores/:id
router.post('/', createProveedor);          // POST /api/proveedores
router.put('/:id', updateProveedor);        // PUT /api/proveedores/:id
router.delete('/:id', deleteProveedor);     // DELETE /api/proveedores/:id

export default router;