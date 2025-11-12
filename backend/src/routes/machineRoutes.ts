// backend/src/routes/machineRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, machineSchema, machineUpdateSchema } from '../utils/validation';
import {
  createMachine,
  listMachines,
  getMachine,
  updateMachine,
  deleteMachine
} from '../controllers/machineController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// CRUD de máquinas
router.post('/', validateRequest(machineSchema), createMachine);
router.get('/', listMachines);
router.get('/:id', getMachine);
router.put('/:id', validateRequest(machineUpdateSchema), updateMachine);
router.delete('/:id', deleteMachine);

export default router;