import { Router } from 'express';
import { login } from '../controllers/authController';
import { validateRequest, loginSchema } from '../utils/validation';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);

export default router;
