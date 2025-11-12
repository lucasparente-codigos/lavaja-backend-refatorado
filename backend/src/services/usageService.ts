// backend/src/services/usageService.ts
import { MachineModel } from '../models/Machine';
import { MachineUsageModel } from '../models/MachineUsage';
import { QueueService } from './queueService';

export class UsageService {
  /**
   * Iniciar uso de uma máquina
   * Regras:
   * - Máquina deve estar disponível
   * - Usuário não pode ter outro uso ativo
   */
  static async startUsage(machineId: number, userId: number) {
    // 1. Verificar se máquina existe
    const machine = await MachineModel.findById(machineId);
    if (!machine) {
      throw new Error('Máquina não encontrada');
    }

    // 2. Verificar se máquina está disponível
    if (machine.status !== 'disponivel') {
      throw new Error('Máquina não está disponível');
    }

    // 3. Verificar se usuário já tem uso ativo
    const hasActiveUsage = await MachineUsageModel.hasActiveUsage(userId);
    if (hasActiveUsage) {
      throw new Error('Você já tem um uso ativo. Finalize-o antes de iniciar outro');
    }

    // 4. Calcular tempos
    const now = new Date();
    const startTime = now.toISOString();
    const estimatedEndTime = new Date(
      now.getTime() + machine.defaultDuration * 60 * 1000
    ).toISOString();

    // 5. Criar uso
    const usage = await MachineUsageModel.create({
      machineId,
      userId,
      startTime,
      estimatedEndTime
    });

    // 6. Atualizar status da máquina
    await MachineModel.updateStatus(machineId, 'em_uso', usage.id);

    // 7. Retornar dados
    return {
      usage,
      machine: await MachineModel.findById(machineId)
    };
  }

  /**
   * Finalizar uso de uma máquina
   * Pode ser chamado por:
   * - Empresa (finaliza qualquer uso de suas máquinas)
   * - Usuário (finaliza apenas seu próprio uso)
   */
  static async finishUsage(
    usageId: number,
    requesterId: number,
    requesterType: 'user' | 'company'
  ) {
    // 1. Buscar uso
    const usage = await MachineUsageModel.findById(usageId);
    if (!usage) {
      throw new Error('Uso não encontrado');
    }

    if (usage.status !== 'em_uso') {
      throw new Error('Este uso já foi finalizado');
    }

    // 2. Verificar permissão
    const machine = await MachineModel.findById(usage.machineId);
    if (!machine) {
      throw new Error('Máquina não encontrada');
    }

    if (requesterType === 'user' && usage.userId !== requesterId) {
      throw new Error('Você só pode finalizar seus próprios usos');
    }

    if (requesterType === 'company' && machine.companyId !== requesterId) {
      throw new Error('Você só pode finalizar usos de suas máquinas');
    }

    // 3. Finalizar uso
    const finishedUsage = await MachineUsageModel.finish(usageId, 'concluida');

    // 4. Verificar se há fila
    const nextInQueue = await QueueService.processQueue(usage.machineId);

    // 5. Se não houver fila, liberar máquina
    if (!nextInQueue) {
      await MachineModel.updateStatus(usage.machineId, 'disponivel', null);
    }

    return {
      usage: finishedUsage,
      machine: await MachineModel.findById(usage.machineId),
      nextInQueue
    };
  }

  /**
   * Cancelar uso ativo do usuário
   */
  static async cancelUsage(userId: number) {
    // 1. Buscar uso ativo do usuário
    const usage = await MachineUsageModel.findActiveByUser(userId);
    if (!usage) {
      throw new Error('Você não tem uso ativo');
    }

    // 2. Cancelar uso
    const cancelledUsage = await MachineUsageModel.finish(usage.id, 'cancelada');

    // 3. Processar fila
    const nextInQueue = await QueueService.processQueue(usage.machineId);

    // 4. Se não houver fila, liberar máquina
    if (!nextInQueue) {
      await MachineModel.updateStatus(usage.machineId, 'disponivel', null);
    }

    return {
      usage: cancelledUsage,
      machine: await MachineModel.findById(usage.machineId),
      nextInQueue
    };
  }

  /**
   * Buscar uso ativo do usuário
   */
  static async getUserActiveUsage(userId: number) {
    const usage = await MachineUsageModel.findActiveByUser(userId);
    if (!usage) {
      return null;
    }

    const machine = await MachineModel.findById(usage.machineId);
    
    // Calcular tempo restante
    const now = Date.now();
    const endTime = new Date(usage.estimatedEndTime).getTime();
    const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000 / 60)); // minutos

    return {
      usage,
      machine,
      timeRemaining
    };
  }
}