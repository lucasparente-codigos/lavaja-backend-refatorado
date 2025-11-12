import { getDb } from '../database';

export interface BaseAccount {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface User extends BaseAccount {
  // Campos específicos de User, se houver
}

export interface UserWithPassword extends User {
  password: string;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | undefined> {
    const db = await getDb();
    return db.get<User>('SELECT id, name, email, createdAt FROM User WHERE email = ?', email);
  }

  static async create(data: Omit<UserWithPassword, 'id' | 'createdAt'>): Promise<User> {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO User (name, email, password) VALUES (?, ?, ?)',
      data.name,
      data.email,
      data.password
    );

    const newUser = await db.get<User>('SELECT id, name, email, createdAt FROM User WHERE id = ?', result.lastID);

    if (!newUser) {
      throw new Error('Falha ao criar usuário');
    }

    return newUser;
  }

  static async findById(id: number): Promise<User | undefined> {
    const db = await getDb();
    return db.get<User>('SELECT id, name, email, createdAt FROM User WHERE id = ?', id);
  }

  static async findByEmailWithPassword(email: string): Promise<UserWithPassword | undefined> {
    const db = await getDb();
    return db.get<UserWithPassword>('SELECT * FROM User WHERE email = ?', email);
  }

  static async findAll(): Promise<User[]> {
    const db = await getDb();
    return db.all<User[]>('SELECT id, name, email, createdAt FROM User');
  }

  static async delete(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.run('DELETE FROM User WHERE id = ?', id);
    return result.changes === 1;
  }
}
