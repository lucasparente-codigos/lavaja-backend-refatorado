// backend/src/routes/publicRoutes.ts
import { Router } from 'express';
import { MachineModel } from '../models/Machine';
import { MachineUsageModel } from '../models/MachineUsage';
import { CompanyModel } from '../models/Company';
import { successResponse, errorResponse } from '../utils/response';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Listar todas as empresas com estatísticas de máquinas
router.get('/companies', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const companies = await CompanyModel.findAll();

    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const machines = await MachineModel.findPublicByCompany(company.id);
        
        const stats = {
          total: machines.length,
          available: machines.filter(m => m.status === 'disponivel').length,
          inUse: machines.filter(m => m.status === 'em_uso').length
        };

        return {
          id: company.id,
          name: company.name,
          machinesAvailable: stats.available,
          machinesInUse: stats.inUse,
          machinesTotal: stats.total
        };
      })
    );

    res.json(successResponse(companiesWithStats));
  } catch (err: any) {
    console.error('Erro ao listar empresas:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
});

// Listar máquinas de uma empresa específica
router.get('/companies/:companyId/machines', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { companyId } = req.params;
    const companyIdNum = parseInt(companyId, 10);

    if (isNaN(companyIdNum)) {
      return res.status(400).json(errorResponse('ID de empresa inválido'));
    }

    // Buscar empresa
    const company = await CompanyModel.findById(companyIdNum);
    if (!company) {
      return res.status(404).json(errorResponse('Empresa não encontrada'));
    }

    // Buscar máquinas públicas
    const machines = await MachineModel.findPublicByCompany(companyIdNum);

    // Adicionar informações de uso atual
    const machinesWithDetails = await Promise.all(
      machines.map(async (machine) => {
        let currentUsage = null;
        let timeRemaining = null;

        if (machine.status === 'em_uso') {
          const usage = await MachineUsageModel.findActiveByMachine(machine.id);
          
          if (usage) {
            const now = Date.now();
            const endTime = new Date(usage.estimatedEndTime).getTime();
            timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000 / 60)); // minutos

            currentUsage = {
              estimatedEndTime: usage.estimatedEndTime,
              timeRemaining
            };
          }
        }

        return {
          id: machine.id,
          name: machine.name,
          type: machine.type,
          status: machine.status,
          defaultDuration: machine.defaultDuration,
          queueLength: machine.queueLength || 0,
          currentUsage
        };
      })
    );

    res.json(successResponse({
      company: {
        id: company.id,
        name: company.name
      },
      machines: machinesWithDetails
    }));
  } catch (err: any) {
    console.error('Erro ao listar máquinas da empresa:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
});

import { getMachineStatus } from '../services/machineStatusService';

// ... (other routes remain the same)

// Status detalhado de uma máquina (para polling)
router.get('/machines/:machineId/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { machineId } = req.params;
    const machineIdNum = parseInt(machineId, 10);
    const userId = req.user?.id;
    const userType = req.user?.type;

    if (isNaN(machineIdNum)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    const status = await getMachineStatus(machineIdNum, userId, userType);
    res.json(successResponse(status));

  } catch (err: any) {
    console.error('Erro ao buscar status da máquina:', err);
    if (err.message === 'Máquina não encontrada') {
      return res.status(404).json(errorResponse(err.message));
    }
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
});

export default router;