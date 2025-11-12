// backend/src/controllers/machineController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MachineModel } from '../models/Machine';
import { successResponse, errorResponse } from '../utils/response';

// Criar máquina
export const createMachine = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, defaultDuration } = req.body;
    const companyId = req.user?.id;

    if (!companyId || req.user?.type !== 'company') {
      return res.status(403).json(errorResponse('Apenas empresas podem criar máquinas'));
    }

    const machine = await MachineModel.create({
      companyId,
      name,
      type,
      defaultDuration
    });

    res.status(201).json(successResponse(machine, 'Máquina criada com sucesso'));
  } catch (err: any) {
    console.error('Erro ao criar máquina:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Listar máquinas da empresa
export const listMachines = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.id;

    if (!companyId || req.user?.type !== 'company') {
      return res.status(403).json(errorResponse('Apenas empresas podem listar suas máquinas'));
    }

    const { machines, stats } = await MachineModel.findByCompanyWithStats(companyId);

    res.json(successResponse({ machines, stats }, 'Máquinas recuperadas com sucesso'));
  } catch (err: any) {
    console.error('Erro ao listar máquinas:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Buscar máquina específica
export const getMachine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const machineId = parseInt(id, 10);
    const companyId = req.user?.id;

    if (isNaN(machineId)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    if (!companyId || req.user?.type !== 'company') {
      return res.status(403).json(errorResponse('Acesso negado'));
    }

    const machine = await MachineModel.findByIdAndCompany(machineId, companyId);

    if (!machine) {
      return res.status(404).json(errorResponse('Máquina não encontrada'));
    }

    res.json(successResponse(machine, 'Máquina recuperada com sucesso'));
  } catch (err: any) {
    console.error('Erro ao buscar máquina:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Atualizar máquina
export const updateMachine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const machineId = parseInt(id, 10);
    const companyId = req.user?.id;
    const updateData = req.body;

    if (isNaN(machineId)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    if (!companyId || req.user?.type !== 'company') {
      return res.status(403).json(errorResponse('Apenas empresas podem atualizar máquinas'));
    }

    const machine = await MachineModel.update(machineId, companyId, updateData);

    if (!machine) {
      return res.status(404).json(errorResponse('Máquina não encontrada'));
    }

    res.json(successResponse(machine, 'Máquina atualizada com sucesso'));
  } catch (err: any) {
    console.error('Erro ao atualizar máquina:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

// Deletar máquina
export const deleteMachine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const machineId = parseInt(id, 10);
    const companyId = req.user?.id;

    if (isNaN(machineId)) {
      return res.status(400).json(errorResponse('ID de máquina inválido'));
    }

    if (!companyId || req.user?.type !== 'company') {
      return res.status(403).json(errorResponse('Apenas empresas podem deletar máquinas'));
    }

    const deleted = await MachineModel.delete(machineId, companyId);

    if (!deleted) {
      return res.status(404).json(errorResponse('Máquina não encontrada'));
    }

    res.json(successResponse(null, 'Máquina deletada com sucesso'));
  } catch (err: any) {
    console.error('Erro ao deletar máquina:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};