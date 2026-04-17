import express from 'express';
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  getCategorias,
  getMarcas,
} from '../controllers/productos.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/categorias', getCategorias);   // GET /api/productos/categorias
router.get('/marcas', getMarcas);           // GET /api/productos/marcas
router.get('/', getProductos);              // GET /api/productos
router.get('/:id', getProductoById);        // GET /api/productos/:id
router.post('/', createProducto);           // POST /api/productos
router.put('/:id', updateProducto);         // PUT /api/productos/:id

export default router;