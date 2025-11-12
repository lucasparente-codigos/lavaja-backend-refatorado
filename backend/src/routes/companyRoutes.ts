import { Router } from 'express';
import { registerCompany, listCompanies, deleteCompany } from '../controllers/companyController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { companySchema } from '../utils/validation';

const router = Router();

router.post('/register', validateRequest(companySchema), registerCompany);

router.get('/', authenticateToken, listCompanies);
router.delete('/:id', authenticateToken, deleteCompany);

export default router;

