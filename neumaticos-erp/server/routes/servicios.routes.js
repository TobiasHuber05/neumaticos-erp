import express from 'express';
import { 
  getServicios, 
  createServicio, 
  updateServicio, 
  deleteServicio 
} from '../controllers/servicios.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getServicios);
router.post('/', createServicio);
router.put('/:id', updateServicio);
router.delete('/:id', deleteServicio);

export default router;
