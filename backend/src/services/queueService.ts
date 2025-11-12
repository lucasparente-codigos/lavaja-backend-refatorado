// backend/src/services/queueService.ts
import { MachineQueueModel } from '../models/MachineQueue';
import { MachineUsageModel } from '../models/MachineUsage';
import { UserModel } from '../models/User';

export class QueueService {
  /**
   * Adicionar usuário à fila
   */
  static async joinQueue(machineId: number, userId: number) {
    // 1. Verificar se usuário já está na fila
    const alreadyInQueue = await MachineQueueModel.isUserInQueue(machineId, userId);
    if (alreadyInQueue) {
      throw new Error('Você já está na fila desta máquina');
    }

    // 2. Calcular posição (última posição + 1)
    const queueLength = await MachineQueueModel.countByMachine(machineId);
    const position = queueLength + 1;

    // 3. Adicionar à fila
    const queueEntry = await MachineQueueModel.add({
      machineId,
      userId,
      position
    });

    // 4. Calcular tempo estimado de espera
    const estimatedWait = await this.calculateEstimatedWait(machineId, position);

    return {
      queue: queueEntry,
      position,
      estimatedWait,
      peopleAhead: position - 1
    };
  }

  /**
   * Remover usuário da fila
   */
  static async leaveQueue(machineId: number, userId: number) {
    // 1. Buscar posição do usuário
    const queueEntry = await MachineQueueModel.findUserPosition(machineId, userId);
    if (!queueEntry) {
      throw new Error('Você não está na fila desta máquina');
    }

    const position = queueEntry.position;

    // 2. Remover da fila
    await MachineQueueModel.remove(queueEntry.id);

    // 3. Reorganizar posições
    await MachineQueueModel.reorderPositions(machineId, position);

    // 4. Se era o notificado, notificar próximo
    if (queueEntry.status === 'notificado') {
      await this.notifyNext(machineId);
    }

    return true;
  }

  /**
   * Processar fila após finalização de uso
   * Retorna o próximo usuário notificado (se houver)
   */
  static async processQueue(machineId: number) {
    // 1. Buscar próximo da fila
    const next = await MachineQueueModel.findNext(machineId);
    
    if (!next) {
      return null; // Fila vazia
    }

    // 2. Notificar próximo
    const notified = await MachineQueueModel.notify(next.id);
    
    if (!notified) {
      return null;
    }

    // 3. Buscar dados do usuário
    const user = await UserModel.findById(notified.userId);

    return {
      userId: notified.userId,
      userName: user?.name,
      expiresAt: notified.expiresAt
    };
  }

  /**
   * Confirmar uso após ser notificado
   */
  static async confirmUsage(machineId: number, userId: number, accept: boolean) {
    // 1. Buscar entrada na fila
    const queueEntry = await MachineQueueModel.findUserPosition(machineId, userId);
    
    if (!queueEntry) {
      throw new Error('Você não está na fila desta máquina');
    }

    if (queueEntry.status !== 'notificado') {
      throw new Error('Você ainda não foi notificado');
    }

    // 2. Verificar se não expirou
    if (queueEntry.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(queueEntry.expiresAt);
      
      if (now > expiresAt) {
        throw new Error('Sua notificação expirou');
      }
    }

    // 3. Se recusou, remover da fila e notificar próximo
    if (!accept) {
      await MachineQueueModel.remove(queueEntry.id);
      await MachineQueueModel.reorderPositions(machineId, queueEntry.position);
      await this.notifyNext(machineId);
      
      return { accepted: false };
    }

    // 4. Se aceitou, verificar se usuário pode usar
    const hasActiveUsage = await MachineUsageModel.hasActiveUsage(userId);
    if (hasActiveUsage) {
      throw new Error('Você já tem um uso ativo. Finalize-o antes de iniciar outro');
    }

    // 5. Remover da fila
    await MachineQueueModel.remove(queueEntry.id);
    
    // 6. Reorganizar fila
    await MachineQueueModel.reorderPositions(machineId, queueEntry.position);

    return { accepted: true };
  }

  /**
   * Notificar próximo da fila
   */
  static async notifyNext(machineId: number) {
    const next = await MachineQueueModel.findNext(machineId);
    
    if (!next) {
      return null;
    }

    return await MachineQueueModel.notify(next.id);
  }

  /**
   * Calcular tempo estimado de espera
   */
  static async calculateEstimatedWait(machineId: number, position: number): Promise<number> {
    // Buscar uso ativo
    const activeUsage = await MachineUsageModel.findActiveByMachine(machineId);
    
    if (!activeUsage) {
      return 0; // Máquina livre
    }

    // Tempo restante do uso atual
    const now = Date.now();
    const endTime = new Date(activeUsage.estimatedEndTime).getTime();
    const currentTimeRemaining = Math.max(0, Math.floor((endTime - now) / 1000 / 60)); // minutos

    // Buscar máquina para pegar defaultDuration
    const MachineModel = require('../models/Machine').MachineModel;
    const machine = await MachineModel.findById(machineId);
    
    if (!machine) {
      return currentTimeRemaining;
    }

    // Tempo total = tempo restante + (pessoas à frente * duração padrão)
    const peopleAhead = position - 1;
    const totalWait = currentTimeRemaining + (peopleAhead * machine.defaultDuration);

    return totalWait;
  }

  /**
   * Buscar posição do usuário na fila
   */
  static async getUserPosition(machineId: number, userId: number) {
    const queueEntry = await MachineQueueModel.findUserPosition(machineId, userId);
    
    if (!queueEntry) {
      return {
        inQueue: false
      };
    }

    const estimatedWait = await this.calculateEstimatedWait(machineId, queueEntry.position);

    return {
      inQueue: true,
      position: queueEntry.position,
      status: queueEntry.status,
      expiresAt: queueEntry.expiresAt,
      estimatedWait
    };
  }

  /**
   * Listar fila de uma máquina com detalhes
   */
  static async getQueueDetails(machineId: number) {
    const queue = await MachineQueueModel.findByMachine(machineId);
    
    const queueWithDetails = await Promise.all(
      queue.map(async (entry) => {
        const user = await UserModel.findById(entry.userId);
        const estimatedWait = await this.calculateEstimatedWait(machineId, entry.position);
        
        return {
          position: entry.position,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email
          } : null,
          status: entry.status,
          joinedAt: entry.joinedAt,
          estimatedWait
        };
      })
    );

    return queueWithDetails;
  }
}