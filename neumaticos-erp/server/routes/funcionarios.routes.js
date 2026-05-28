import { Router } from 'express';
import {
    getFuncionarios, getFuncionarioById, createFuncionario,
    updateFuncionario, deleteFuncionario,
    getFamiliares, addFamiliar, deleteFamiliar
} from '../controllers/Personal/funcionarios.controller.js';

const router = Router();
router.get('/funcionarios', getFuncionarios);
router.get('/funcionarios/:id', getFuncionarioById);
router.post('/funcionarios', createFuncionario);
router.put('/funcionarios/:id', updateFuncionario);
router.delete('/funcionarios/:id', deleteFuncionario);
router.get('/funcionarios/:id/familiares', getFamiliares);
router.post('/funcionarios/:id/familiares', addFamiliar);
router.delete('/funcionarios/familiares/:idFamiliar', deleteFamiliar);
export default router;