// backend/src/models/Machine.ts
import { getDb } from '../database';

export interface Machine {
  id: number;
  companyId: number;
  name: string;
  type: 'lavadora' | 'secadora';
  defaultDuration: number; // minutos
  status: 'disponivel' | 'em_uso' | 'manutencao';
  currentUsageId: number | null;
  createdAt: string;
}

export type MachineCreateData = Omit<Machine, 'id' | 'status' | 'currentUsageId' | 'createdAt'>;
export type MachineUpdateData = Partial<Omit<Machine, 'id' | 'companyId' | 'createdAt'>>;

export class MachineModel {
  // Buscar por ID
  static async findById(id: number): Promise<Machine | undefined> {
    const db = await getDb();
    return db.get<Machine>('SELECT * FROM Machine WHERE id = ?', id);
  }

  // Buscar por ID e validar se pertence à empresa
  static async findByIdAndCompany(id: number, companyId: number): Promise<Machine | undefined> {
    const db = await getDb();
    return db.get<Machine>(
      'SELECT * FROM Machine WHERE id = ? AND companyId = ?',
      id,
      companyId
    );
  }

  // Listar todas as máquinas de uma empresa
  static async findByCompany(companyId: number): Promise<Machine[]> {
    const db = await getDb();
    return db.all<Machine[]>(
      'SELECT * FROM Machine WHERE companyId = ? ORDER BY createdAt DESC',
      companyId
    );
  }

  // Listar máquinas de uma empresa com contadores
  static async findByCompanyWithStats(companyId: number) {
    const db = await getDb();
    
    const machines = await db.all<Machine[]>(
      'SELECT * FROM Machine WHERE companyId = ? ORDER BY createdAt DESC',
      companyId
    );

    const stats = await db.get<{
      total: number;
      disponivel: number;
      em_uso: number;
      manutencao: number;
    }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) as disponivel,
        SUM(CASE WHEN status = 'em_uso' THEN 1 ELSE 0 END) as em_uso,
        SUM(CASE WHEN status = 'manutencao' THEN 1 ELSE 0 END) as manutencao
      FROM Machine 
      WHERE companyId = ?`,
      companyId
    );

    return { machines, stats };
  }

  // Criar máquina
  static async create(data: MachineCreateData): Promise<Machine> {
    const db = await getDb();
    
    const result = await db.run(
      `INSERT INTO Machine (companyId, name, type, defaultDuration, status) 
       VALUES (?, ?, ?, ?, 'disponivel')`,
      data.companyId,
      data.name,
      data.type,
      data.defaultDuration
    );

    const machine = await db.get<Machine>(
      'SELECT * FROM Machine WHERE id = ?',
      result.lastID
    );

    if (!machine) {
      throw new Error('Falha ao criar máquina');
    }

    return machine;
  }

  // Atualizar máquina
 // Linha 143 - método update
  static async update(id: number, companyId: number, data: MachineUpdateData): Promise<Machine | null> {
    const db = await getDb();

    // Verificar se máquina existe e pertence à empresa
    const machine = await this.findByIdAndCompany(id, companyId);
    if (!machine) {
      return null;
    }

    // Construir query dinâmica
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.type !== undefined) {
      fields.push('type = ?');
      values.push(data.type);
    }
    if (data.defaultDuration !== undefined) {
      fields.push('defaultDuration = ?');
      values.push(data.defaultDuration);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.currentUsageId !== undefined) {
      fields.push('currentUsageId = ?');
      values.push(data.currentUsageId);
    }

    if (fields.length === 0) {
      return machine; // Nada para atualizar
    }

    values.push(id);

    await db.run(
      `UPDATE Machine SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );

    const updatedMachine = await this.findById(id);
    return updatedMachine || null; // CORREÇÃO AQUI
  }

  // Deletar máquina
  static async delete(id: number, companyId: number): Promise<boolean> {
    const db = await getDb();

    // Verificar se máquina existe e pertence à empresa
    const machine = await this.findByIdAndCompany(id, companyId);
    if (!machine) {
      return false;
    }

    const result = await db.run(
      'DELETE FROM Machine WHERE id = ? AND companyId = ?',
      id,
      companyId
    );

    return (result.changes ?? 0) > 0;
  }

  // Verificar se máquina está disponível para uso
  static async isAvailable(id: number): Promise<boolean> {
    const machine = await this.findById(id);
    return machine?.status === 'disponivel';
  }

  // Atualizar status da máquina
  static async updateStatus(
    id: number, 
    status: Machine['status'], 
    currentUsageId: number | null = null
  ): Promise<void> {
    const db = await getDb();
    
    await db.run(
      'UPDATE Machine SET status = ?, currentUsageId = ? WHERE id = ?',
      status,
      currentUsageId,
      id
    );
  }

  // Buscar máquinas públicas de uma empresa (para usuários visualizarem)
  static async findPublicByCompany(companyId: number) {
    const db = await getDb();
    
    return db.all<Array<Machine & { queueLength?: number }>>(
      `SELECT 
        m.*,
        (SELECT COUNT(*) FROM MachineQueue WHERE machineId = m.id AND status = 'aguardando') as queueLength
      FROM Machine m
      WHERE m.companyId = ? AND m.status != 'manutencao'
      ORDER BY m.name`,
      companyId
    );
  }
}