import { Router } from 'express';
import { registerUser, listUsers, deleteUser } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { userSchema } from '../utils/validation';

const router = Router();

router.post('/register', validateRequest(userSchema), registerUser);

router.get('/', authenticateToken, listUsers);
router.delete('/:id', authenticateToken, deleteUser);

export default router;

