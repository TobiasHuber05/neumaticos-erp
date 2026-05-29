import express from 'express';
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  getCategorias
} from '../controllers/Compras/proveedores.controller.js';
import { requireModulo, verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren token
router.use(verifyToken);

router.get('/categorias', requireModulo('compras', 'ver'), getCategorias);
router.get('/', requireModulo('compras', 'ver'), getProveedores);
router.get('/:id', requireModulo('compras', 'ver'), getProveedorById);
router.post('/', requireModulo('compras', 'editar'), createProveedor);
router.put('/:id', requireModulo('compras', 'editar'), updateProveedor);
router.delete('/:id', requireModulo('compras', 'editar'), deleteProveedor);

export default router;
