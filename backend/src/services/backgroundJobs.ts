// backend/src/services/backgroundJobs.ts
import { MachineQueueModel } from '../models/MachineQueue';
import { MachineUsageModel } from '../models/MachineUsage';
import { MachineModel } from '../models/Machine';
import { QueueService } from './queueService';

export class BackgroundJobs {
  private static expirationJobInterval: NodeJS.Timeout | null = null;
  private static autoReleaseJobInterval: NodeJS.Timeout | null = null;

  /**
   * Iniciar todos os jobs
   */
  static start() {
    console.log('🤖 Iniciando background jobs...');
    
    this.startExpirationJob();
    this.startAutoReleaseJob();
    
    console.log('✅ Background jobs iniciados');
  }

  /**
   * Parar todos os jobs
   */
  static stop() {
    console.log('🛑 Parando background jobs...');
    
    if (this.expirationJobInterval) {
      clearInterval(this.expirationJobInterval);
      this.expirationJobInterval = null;
    }
    
    if (this.autoReleaseJobInterval) {
      clearInterval(this.autoReleaseJobInterval);
      this.autoReleaseJobInterval = null;
    }
    
    console.log('✅ Background jobs parados');
  }

  /**
   * Job de expiração de notificações
   * Roda a cada 30 segundos
   */
  private static startExpirationJob() {
    this.expirationJobInterval = setInterval(async () => {
      try {
        await this.processExpiredNotifications();
      } catch (err) {
        console.error('❌ Erro no job de expiração:', err);
      }
    }, 30 * 1000); // 30 segundos
  }

  /**
   * Job de liberação automática
   * Roda a cada 1 minuto
   */
  private static startAutoReleaseJob() {
    this.autoReleaseJobInterval = setInterval(async () => {
      try {
        await this.processAutoRelease();
      } catch (err) {
        console.error('❌ Erro no job de liberação automática:', err);
      }
    }, 60 * 1000); // 1 minuto
  }

  /**
   * Processar notificações expiradas
   */
  private static async processExpiredNotifications() {
    const expired = await MachineQueueModel.findExpired();
    
    if (expired.length === 0) {
      return;
    }

    console.log(`⏰ Processando ${expired.length} notificações expiradas...`);

    for (const queueEntry of expired) {
      try {
        // Marcar como expirado
        await MachineQueueModel.markAsExpired(queueEntry.id);
        
        // Remover da fila
        await MachineQueueModel.remove(queueEntry.id);
        
        // Reorganizar posições
        await MachineQueueModel.reorderPositions(queueEntry.machineId, queueEntry.position);
        
        // Notificar próximo
        await QueueService.notifyNext(queueEntry.machineId);
        
        console.log(`✅ Notificação expirada processada: User ${queueEntry.userId} - Machine ${queueEntry.machineId}`);
      } catch (err) {
        console.error(`❌ Erro ao processar expiração da fila ${queueEntry.id}:`, err);
      }
    }
  }

  /**
   * Processar usos que devem ser liberados automaticamente
   * Libera máquinas que passaram 5 minutos do tempo estimado
   */
  private static async processAutoRelease() {
    const expiredUsages = await MachineUsageModel.findExpiredUsages();
    
    if (expiredUsages.length === 0) {
      return;
    }

    console.log(`⏰ Processando ${expiredUsages.length} usos expirados para liberação automática...`);

    for (const usage of expiredUsages) {
      try {
        // Finalizar uso
        await MachineUsageModel.finish(usage.id, 'concluida');
        
        // Processar fila
        const nextInQueue = await QueueService.processQueue(usage.machineId);
        
        // Se não houver fila, liberar máquina
        if (!nextInQueue) {
          await MachineModel.updateStatus(usage.machineId, 'disponivel', null);
        }
        
        console.log(`✅ Uso liberado automaticamente: Usage ${usage.id} - Machine ${usage.machineId}`);
      } catch (err) {
        console.error(`❌ Erro ao liberar uso ${usage.id}:`, err);
      }
    }
  }
}