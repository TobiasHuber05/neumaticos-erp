import { Router } from 'express';
import {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  getOperaciones,
} from '../controllers/Contabilidad/modeloAsiento.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/modelos-asientos/operaciones', getOperaciones);
router.get('/modelos-asientos', listar);
router.get('/modelos-asientos/:id', obtener);
router.post('/modelos-asientos', crear);
router.put('/modelos-asientos/:id', actualizar);
router.delete('/modelos-asientos/:id', eliminar);

export default router;
