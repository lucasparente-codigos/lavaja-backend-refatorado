// backend/src/routes/usageRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  startUsage,
  finishUsage,
  cancelUsage,
  getMyCurrentUsage,
  finishMachineUsage
} from '../controllers/usageController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de usuário
router.post('/start/:machineId', startUsage);
router.post('/cancel', cancelUsage);
router.get('/my-current', getMyCurrentUsage);

// Rotas compartilhadas (empresa e usuário)
router.post('/finish/:usageId', finishUsage);

// Rotas de empresa
router.post('/machines/:machineId/finish', finishMachineUsage);

export default router;