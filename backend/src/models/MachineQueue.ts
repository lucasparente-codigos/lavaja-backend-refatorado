// backend/src/models/MachineQueue.ts
import { getDb } from '../database';

export interface MachineQueue {
  id: number;
  machineId: number;
  userId: number;
  position: number;
  joinedAt: string;
  notifiedAt: string | null;
  expiresAt: string | null;
  status: 'aguardando' | 'notificado' | 'expirado' | 'cancelado';
}

export type MachineQueueCreateData = {
  machineId: number;
  userId: number;
  position: number;
};

export class MachineQueueModel {
  // Buscar por ID
  static async findById(id: number): Promise<MachineQueue | undefined> {
    const db = await getDb();
    return db.get<MachineQueue>('SELECT * FROM MachineQueue WHERE id = ?', id);
  }

  // Adicionar usuário à fila
  static async add(data: MachineQueueCreateData): Promise<MachineQueue> {
    const db = await getDb();
    
    const result = await db.run(
      `INSERT INTO MachineQueue (machineId, userId, position, status) 
       VALUES (?, ?, ?, 'aguardando')`,
      data.machineId,
      data.userId,
      data.position
    );

    const queue = await db.get<MachineQueue>(
      'SELECT * FROM MachineQueue WHERE id = ?',
      result.lastID
    );

    if (!queue) {
      throw new Error('Falha ao adicionar à fila');
    }

    return queue;
  }

  // Buscar fila de uma máquina
  static async findByMachine(machineId: number): Promise<MachineQueue[]> {
    const db = await getDb();
    return db.all<MachineQueue[]>(
      `SELECT * FROM MachineQueue 
       WHERE machineId = ? AND status IN ('aguardando', 'notificado')
       ORDER BY position`,
      machineId
    );
  }

  // Buscar próximo da fila (position = 1, aguardando)
  static async findNext(machineId: number): Promise<MachineQueue | undefined> {
    const db = await getDb();
    return db.get<MachineQueue>(
      `SELECT * FROM MachineQueue 
       WHERE machineId = ? AND position = 1 AND status = 'aguardando'`,
      machineId
    );
  }

  // Buscar posição do usuário na fila de uma máquina
  static async findUserPosition(machineId: number, userId: number): Promise<MachineQueue | undefined> {
    const db = await getDb();
    return db.get<MachineQueue>(
      `SELECT * FROM MachineQueue 
       WHERE machineId = ? AND userId = ? AND status IN ('aguardando', 'notificado')`,
      machineId,
      userId
    );
  }

  // Contar quantos estão na fila
  static async countByMachine(machineId: number): Promise<number> {
    const db = await getDb();
    const result = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM MachineQueue 
       WHERE machineId = ? AND status IN ('aguardando', 'notificado')`,
      machineId
    );
    return result?.count ?? 0;
  }

  // Remover da fila
  static async remove(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.run('DELETE FROM MachineQueue WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  // Remover usuário de uma fila específica
  static async removeUserFromMachine(machineId: number, userId: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.run(
      `DELETE FROM MachineQueue 
       WHERE machineId = ? AND userId = ? AND status IN ('aguardando', 'notificado')`,
      machineId,
      userId
    );
    return (result.changes ?? 0) > 0;
  }

  // Notificar próximo da fila
  // Linha 130 - método notify
  static async notify(id: number): Promise<MachineQueue | null> {
    const db = await getDb();
    
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutos
    
    await db.run(
      `UPDATE MachineQueue 
      SET status = 'notificado', notifiedAt = ?, expiresAt = ? 
      WHERE id = ?`,
      now,
      expiresAt,
      id
    );

    const updatedQueue = await this.findById(id);
    return updatedQueue || null; // CORREÇÃO AQUI
  }

  // Reorganizar posições após remoção
  static async reorderPositions(machineId: number, fromPosition: number): Promise<void> {
    const db = await getDb();
    
    await db.run(
      `UPDATE MachineQueue 
       SET position = position - 1 
       WHERE machineId = ? AND position > ? AND status = 'aguardando'`,
      machineId,
      fromPosition
    );
  }

  // Buscar filas expiradas (notificado há mais de 2 minutos)
  static async findExpired(): Promise<MachineQueue[]> {
    const db = await getDb();
    const now = new Date().toISOString();
    
    return db.all<MachineQueue[]>(
      `SELECT * FROM MachineQueue 
       WHERE status = 'notificado' AND expiresAt < ?`,
      now
    );
  }

  // Marcar como expirado
  static async markAsExpired(id: number): Promise<void> {
    const db = await getDb();
    await db.run(
      `UPDATE MachineQueue SET status = 'expirado' WHERE id = ?`,
      id
    );
  }

  // Verificar se usuário já está na fila
  static async isUserInQueue(machineId: number, userId: number): Promise<boolean> {
    const queue = await this.findUserPosition(machineId, userId);
    return !!queue;
  }
}