import { getDb } from '../database';

import { BaseAccount } from './User'; // Reutiliza a interface base

export interface Company extends BaseAccount {
  cnpj: string;
}

export interface CompanyWithPassword extends Company {
  password: string;
}

export class CompanyModel {
  static async findByEmail(email: string): Promise<Company | undefined> {
    const db = await getDb();
    return db.get<Company>('SELECT id, name, email, cnpj, createdAt FROM Company WHERE email = ?', email);
  }

  static async findByEmailWithPassword(email: string): Promise<CompanyWithPassword | undefined> {
    const db = await getDb();
    return db.get<CompanyWithPassword>('SELECT * FROM Company WHERE email = ?', email);
  }

  static async findByCnpj(cnpj: string): Promise<Company | undefined> {
    const db = await getDb();
    return db.get<Company>('SELECT * FROM Company WHERE cnpj = ?', cnpj);
  }

  static async create(data: Omit<CompanyWithPassword, 'id' | 'createdAt'>): Promise<Company> {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO Company (name, email, cnpj, password) VALUES (?, ?, ?, ?)',
      data.name,
      data.email,
      data.cnpj,
      data.password
    );

    const newCompany = await db.get<Company>('SELECT id, name, email, cnpj, createdAt FROM Company WHERE id = ?', result.lastID);

    if (!newCompany) {
      throw new Error('Falha ao criar empresa');
    }

    return newCompany;
  }

  static async findById(id: number): Promise<Company | undefined> {
    const db = await getDb();
    return db.get<Company>('SELECT id, name, email, cnpj, createdAt FROM Company WHERE id = ?', id);
  }

  static async findAll(): Promise<Company[]> {
    const db = await getDb();
    return db.all<Company[]>('SELECT id, name, email, cnpj, createdAt FROM Company');
  }

  static async delete(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.run('DELETE FROM Company WHERE id = ?', id);
    return result.changes === 1;
  }
}