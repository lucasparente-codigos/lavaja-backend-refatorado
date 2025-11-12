// backend/src/routes/queueRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  joinQueue,
  leaveQueue,
  confirmUsage,
  getMyPosition,
  getMachineQueue
} from '../controllers/queueController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de usuário
router.post('/join/:machineId', joinQueue);
router.delete('/leave/:machineId', leaveQueue);
router.post('/confirm/:machineId', confirmUsage);
router.get('/my-position/:machineId', getMyPosition);

// Rotas de empresa
router.get('/machine/:machineId', getMachineQueue);

export default router;