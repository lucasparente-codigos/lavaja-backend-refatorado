// backend/src/services/machineStatusService.ts
import { MachineModel } from '../models/Machine';
import { MachineUsageModel } from '../models/MachineUsage';
import { MachineQueueModel } from '../models/MachineQueue';

export const getMachineStatus = async (machineId: number, userId?: number, userType?: string) => {
  const machine = await MachineModel.findById(machineId);
  if (!machine) {
    throw new Error('Máquina não encontrada');
  }

  let currentUsage = null;
  if (machine.status === 'em_uso') {
    const usage = await MachineUsageModel.findActiveByMachine(machineId);
    if (usage) {
      const now = Date.now();
      const endTime = new Date(usage.estimatedEndTime).getTime();
      const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000 / 60));
      currentUsage = {
        estimatedEndTime: usage.estimatedEndTime,
        timeRemaining,
      };
    }
  }

  const queue = await MachineQueueModel.findByMachine(machineId);
  const queueSimplified = queue.map(q => ({
    position: q.position,
    status: q.status,
  }));

  let myStatus = null;
  if (userId && userType === 'user') {
    const hasActiveUsage = await MachineUsageModel.hasActiveUsage(userId);
    const queueEntry = await MachineQueueModel.findUserPosition(machineId, userId);
    myStatus = {
      hasActiveUsage,
      inQueue: !!queueEntry,
      position: queueEntry?.position,
      queueStatus: queueEntry?.status,
      isNotified: queueEntry?.status === 'notificado',
      expiresAt: queueEntry?.expiresAt,
    };
  }

  return {
    machine: {
      id: machine.id,
      name: machine.name,
      type: machine.type,
      status: machine.status,
      defaultDuration: machine.defaultDuration,
    },
    currentUsage,
    queue: queueSimplified,
    myStatus,
  };
};
