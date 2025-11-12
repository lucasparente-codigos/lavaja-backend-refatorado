// backend/src/controllers/queueController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { QueueService } from '../services/queueService';
import { successResponse, errorResponse } from '../utils/response';
import { broadcastMachineUpdate } from '../socket';

// Entrar na fila
export const joinQueue = async (req: AuthRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const userId = req.user?.id;

    if (!userId || req.user?.type !== 'user') {
      return res.status(403).json(errorResponse('Apenas usuários podem entrar na fila'));
    }

    const machineIdNum = parseInt(machineId, 10);
    if (isNaN(machineIdNum)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    const result = await QueueService.joinQueue(machineIdNum, userId);

    broadcastMachineUpdate(machineIdNum);

    res.status(201).json(successResponse(result, 'Você entrou na fila'));
  } catch (err: any) {
    console.error('Erro ao entrar na fila:', err);
    
    if (err.message.includes('já está na fila')) {
      return res.status(400).json(errorResponse(err.message));
    }
    
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Sair da fila
export const leaveQueue = async (req: AuthRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const userId = req.user?.id;

    if (!userId || req.user?.type !== 'user') {
      return res.status(403).json(errorResponse('Apenas usuários podem sair da fila'));
    }

    const machineIdNum = parseInt(machineId, 10);
    if (isNaN(machineIdNum)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    await QueueService.leaveQueue(machineIdNum, userId);

    broadcastMachineUpdate(machineIdNum);

    res.json(successResponse(null, 'Você saiu da fila'));
  } catch (err: any) {
    console.error('Erro ao sair da fila:', err);
    
    if (err.message.includes('não está na fila')) {
      return res.status(400).json(errorResponse(err.message));
    }
    
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Confirmar uso após notificação
export const confirmUsage = async (req: AuthRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const { accept } = req.body;
    const userId = req.user?.id;

    if (!userId || req.user?.type !== 'user') {
      return res.status(403).json(errorResponse('Apenas usuários podem confirmar uso'));
    }

    const machineIdNum = parseInt(machineId, 10);
    if (isNaN(machineIdNum)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    if (typeof accept !== 'boolean') {
      return res.status(400).json(errorResponse('Campo "accept" deve ser true ou false'));
    }

    const result = await QueueService.confirmUsage(machineIdNum, userId, accept);

    // Se aceitou, iniciar uso
    if (result.accepted) {
      const { UsageService } = require('../services/usageService');
      const usageResult = await UsageService.startUsage(machineIdNum, userId);
      
      broadcastMachineUpdate(machineIdNum); // Broadcast after usage starts
      return res.json(successResponse(usageResult, 'Uso iniciado com sucesso'));
    }

    broadcastMachineUpdate(machineIdNum); // Broadcast after machine is dispensed
    res.json(successResponse(null, 'Você dispensou a máquina'));
  } catch (err: any) {
    console.error('Erro ao confirmar uso:', err);
    
    if (err.message.includes('não está na fila') || 
        err.message.includes('não foi notificado') || 
        err.message.includes('expirou') ||
        err.message.includes('já tem um uso ativo')) {
      return res.status(400).json(errorResponse(err.message));
    }
    
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Buscar posição do usuário na fila
export const getMyPosition = async (req: AuthRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const userId = req.user?.id;

    if (!userId || req.user?.type !== 'user') {
      return res.status(403).json(errorResponse('Apenas usuários podem consultar sua posição'));
    }

    const machineIdNum = parseInt(machineId, 10);
    if (isNaN(machineIdNum)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    const result = await QueueService.getUserPosition(machineIdNum, userId);

    res.json(successResponse(result));
  } catch (err: any) {
    console.error('Erro ao buscar posição na fila:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Listar fila de uma máquina (empresa)
export const getMachineQueue = async (req: AuthRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const companyId = req.user?.id;

    if (!companyId || req.user?.type !== 'company') {
      return res.status(403).json(errorResponse('Apenas empresas podem ver a fila de suas máquinas'));
    }

    const machineIdNum = parseInt(machineId, 10);
    if (isNaN(machineIdNum)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    // Verificar se máquina pertence à empresa
    const { MachineModel } = require('../models/Machine');
    const machine = await MachineModel.findByIdAndCompany(machineIdNum, companyId);
    
    if (!machine) {
      return res.status(404).json(errorResponse('Máquina não encontrada'));
    }

    const queue = await QueueService.getQueueDetails(machineIdNum);

    res.json(successResponse({ queue }));
  } catch (err: any) {
    console.error('Erro ao buscar fila da máquina:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};