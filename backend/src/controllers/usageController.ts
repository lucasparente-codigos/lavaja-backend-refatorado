// backend/src/controllers/usageController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UsageService } from '../services/usageService';
import { successResponse, errorResponse } from '../utils/response';
import { broadcastMachineUpdate } from '../socket';

// Iniciar uso de máquina
export const startUsage = async (req: AuthRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const userId = req.user?.id;

    if (!userId || req.user?.type !== 'user') {
      return res.status(403).json(errorResponse('Apenas usuários podem iniciar uso de máquinas'));
    }

    const machineIdNum = parseInt(machineId, 10);
    if (isNaN(machineIdNum)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    const result = await UsageService.startUsage(machineIdNum, userId);

    broadcastMachineUpdate(machineIdNum);

    res.status(201).json(successResponse(result, 'Uso iniciado com sucesso'));
  } catch (err: any) {
    console.error('Erro ao iniciar uso:', err);
    
    if (err.message.includes('não encontrada') || err.message.includes('não está disponível') || err.message.includes('já tem um uso ativo')) {
      return res.status(400).json(errorResponse(err.message));
    }
    
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Finalizar uso (empresa ou usuário)
export const finishUsage = async (req: AuthRequest, res: Response) => {
  try {
    const { usageId } = req.params;
    const requesterId = req.user?.id;
    const requesterType = req.user?.type;

    if (!requesterId || !requesterType) {
      return res.status(403).json(errorResponse('Autenticação necessária'));
    }

    const usageIdNum = parseInt(usageId, 10);
    if (isNaN(usageIdNum)) {
      return res.status(400).json(errorResponse('ID de uso inválido'));
    }

    const result = await UsageService.finishUsage(usageIdNum, requesterId, requesterType);

    if (result.machineId) {
      broadcastMachineUpdate(result.machineId);
    }

    res.json(successResponse(result, 'Uso finalizado com sucesso'));
  } catch (err: any) {
    console.error('Erro ao finalizar uso:', err);
    
    if (err.message.includes('não encontrado') || err.message.includes('já foi finalizado') || err.message.includes('só pode finalizar')) {
      return res.status(400).json(errorResponse(err.message));
    }
    
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Cancelar uso próprio (usuário)
export const cancelUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId || req.user?.type !== 'user') {
      return res.status(403).json(errorResponse('Apenas usuários podem cancelar seus usos'));
    }

    const result = await UsageService.cancelUsage(userId);

    if (result.machineId) {
      broadcastMachineUpdate(result.machineId);
    }

    res.json(successResponse(result, 'Uso cancelado com sucesso'));
  } catch (err: any) {
    console.error('Erro ao cancelar uso:', err);
    
    if (err.message.includes('não tem uso ativo')) {
      return res.status(400).json(errorResponse(err.message));
    }
    
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Buscar uso ativo do usuário
export const getMyCurrentUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId || req.user?.type !== 'user') {
      return res.status(403).json(errorResponse('Apenas usuários podem consultar seus usos'));
    }

    const result = await UsageService.getUserActiveUsage(userId);

    res.json(successResponse(result));
  } catch (err: any) {
    console.error('Erro ao buscar uso ativo:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Finalizar uso de máquina específica (empresa)
export const finishMachineUsage = async (req: AuthRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const companyId = req.user?.id;

    if (!companyId || req.user?.type !== 'company') {
      return res.status(403).json(errorResponse('Apenas empresas podem finalizar usos de suas máquinas'));
    }

    const machineIdNum = parseInt(machineId, 10);
    if (isNaN(machineIdNum)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    // Importar models diretamente para evitar circular dependency
    const { MachineModel } = require('../models/Machine');
    const { MachineUsageModel } = require('../models/MachineUsage');

    // Verificar se máquina pertence à empresa
    const machine = await MachineModel.findByIdAndCompany(machineIdNum, companyId);
    if (!machine) {
      return res.status(404).json(errorResponse('Máquina não encontrada'));
    }

    // Buscar uso ativo da máquina
    const activeUsage = await MachineUsageModel.findActiveByMachine(machineIdNum);
    if (!activeUsage) {
      return res.status(400).json(errorResponse('Esta máquina não tem uso ativo'));
    }

    // Finalizar uso
    const result = await UsageService.finishUsage(activeUsage.id, companyId, 'company');

    broadcastMachineUpdate(machineIdNum);

    res.json(successResponse(result, 'Uso finalizado com sucesso'));
  } catch (err: any) {
    console.error('Erro ao finalizar uso da máquina:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};