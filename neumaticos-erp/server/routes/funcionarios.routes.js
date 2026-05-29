import { Router } from 'express';
import {
    getFuncionarios, getFuncionarioById, createFuncionario,
    updateFuncionario, deleteFuncionario,
    getFamiliares, addFamiliar, deleteFamiliar,
    getConceptosFuncionario, addConceptoFuncionario, deleteConceptoFuncionario
} from '../controllers/Personal/funcionarios.controller.js';

const router = Router();
// Rutas fijas primero
router.get('/funcionarios', getFuncionarios);
router.post('/funcionarios', createFuncionario);

// Subrutas específicas antes de /:id
router.get('/funcionarios/:id/familiares', getFamiliares);
router.post('/funcionarios/:id/familiares', addFamiliar);
router.get('/funcionarios/:id/conceptos', getConceptosFuncionario);
router.post('/funcionarios/:id/conceptos', addConceptoFuncionario);

// Deletes sin parámetro anidado antes de /:id
router.delete('/funcionarios/familiares/:idFamiliar', deleteFamiliar);
router.delete('/funcionarios/conceptos/:idConcepto', deleteConceptoFuncionario);

// Rutas genéricas con /:id al final
router.get('/funcionarios/:id', getFuncionarioById);
router.put('/funcionarios/:id', updateFuncionario);
router.delete('/funcionarios/:id', deleteFuncionario);

export default router;