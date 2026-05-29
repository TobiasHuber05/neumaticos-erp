import express from 'express';
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getCategorias,
  getMarcas,
} from '../controllers/Inventario/productos.controller.js';
import { requireModulo, verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/categorias', requireModulo('stock', 'ver'), getCategorias);
router.get('/marcas', requireModulo('stock', 'ver'), getMarcas);
router.get('/', requireModulo('stock', 'ver'), getProductos);
router.get('/:id', requireModulo('stock', 'ver'), getProductoById);
router.post('/', requireModulo('stock', 'editar'), createProducto);
router.put('/:id', requireModulo('stock', 'editar'), updateProducto);
router.delete('/:id', requireModulo('stock', 'editar'), deleteProducto);

export default router;
