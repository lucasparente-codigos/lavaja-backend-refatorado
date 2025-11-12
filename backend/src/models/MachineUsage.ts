// backend/src/models/MachineUsage.ts
import { getDb } from '../database';

export interface MachineUsage {
  id: number;
  machineId: number;
  userId: number;
  startTime: string; // ISO 8601
  estimatedEndTime: string; // ISO 8601
  actualEndTime: string | null; // ISO 8601
  status: 'em_uso' | 'concluida' | 'cancelada';
  createdAt: string;
}

export type MachineUsageCreateData = {
  machineId: number;
  userId: number;
  startTime: string;
  estimatedEndTime: string;
};

export class MachineUsageModel {
  // Buscar por ID
  static async findById(id: number): Promise<MachineUsage | undefined> {
    const db = await getDb();
    return db.get<MachineUsage>('SELECT * FROM MachineUsage WHERE id = ?', id);
  }

  // Criar uso
  static async create(data: MachineUsageCreateData): Promise<MachineUsage> {
    const db = await getDb();
    
    const result = await db.run(
      `INSERT INTO MachineUsage (machineId, userId, startTime, estimatedEndTime, status) 
       VALUES (?, ?, ?, ?, 'em_uso')`,
      data.machineId,
      data.userId,
      data.startTime,
      data.estimatedEndTime
    );

    const usage = await db.get<MachineUsage>(
      'SELECT * FROM MachineUsage WHERE id = ?',
      result.lastID
    );

    if (!usage) {
      throw new Error('Falha ao criar uso de máquina');
    }

    return usage;
  }

  // Buscar uso ativo de um usuário
  static async findActiveByUser(userId: number): Promise<MachineUsage | undefined> {
    const db = await getDb();
    return db.get<MachineUsage>(
      `SELECT * FROM MachineUsage 
       WHERE userId = ? AND status = 'em_uso' 
       ORDER BY startTime DESC 
       LIMIT 1`,
      userId
    );
  }

  // Buscar uso ativo de uma máquina
  static async findActiveByMachine(machineId: number): Promise<MachineUsage | undefined> {
    const db = await getDb();
    return db.get<MachineUsage>(
      `SELECT * FROM MachineUsage 
       WHERE machineId = ? AND status = 'em_uso' 
       ORDER BY startTime DESC 
       LIMIT 1`,
      machineId
    );
  }

  // Finalizar uso
  // Linha 93 - método finish
  static async finish(id: number, status: 'concluida' | 'cancelada' = 'concluida'): Promise<MachineUsage | null> {
    const db = await getDb();
    
    const now = new Date().toISOString();
    
    await db.run(
      `UPDATE MachineUsage 
      SET actualEndTime = ?, status = ? 
      WHERE id = ? AND status = 'em_uso'`,
      now,
      status,
      id
    );

    const updatedUsage = await this.findById(id);
    return updatedUsage || null; // CORREÇÃO AQUI
  }

  // Buscar histórico de uso de um usuário
  static async findHistoryByUser(userId: number, limit: number = 10): Promise<MachineUsage[]> {
    const db = await getDb();
    return db.all<MachineUsage[]>(
      `SELECT * FROM MachineUsage 
       WHERE userId = ? 
       ORDER BY createdAt DESC 
       LIMIT ?`,
      userId,
      limit
    );
  }

  // Buscar histórico de uso de uma máquina
  static async findHistoryByMachine(machineId: number, limit: number = 10): Promise<MachineUsage[]> {
    const db = await getDb();
    return db.all<MachineUsage[]>(
      `SELECT * FROM MachineUsage 
       WHERE machineId = ? 
       ORDER BY createdAt DESC 
       LIMIT ?`,
      machineId,
      limit
    );
  }

  // Buscar usos que devem ser liberados automaticamente (5min após estimatedEndTime)
  static async findExpiredUsages(): Promise<MachineUsage[]> {
    const db = await getDb();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    return db.all<MachineUsage[]>(
      `SELECT * FROM MachineUsage 
       WHERE status = 'em_uso' 
       AND estimatedEndTime < ?`,
      fiveMinutesAgo
    );
  }

  // Verificar se usuário tem uso ativo
  static async hasActiveUsage(userId: number): Promise<boolean> {
    const usage = await this.findActiveByUser(userId);
    return !!usage;
  }
}