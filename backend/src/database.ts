// backend/src/database.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve(__dirname, '..', 'data', 'dev.db');

export async function openDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // ===== TABELAS EXISTENTES =====
  await db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Company (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      cnpj TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ===== NOVAS TABELAS =====
  
  // Tabela de Máquinas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Machine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyId INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('lavadora', 'secadora')),
      defaultDuration INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'disponivel' CHECK(status IN ('disponivel', 'em_uso', 'manutencao')),
      currentUsageId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE,
      FOREIGN KEY (currentUsageId) REFERENCES MachineUsage(id) ON DELETE SET NULL
    );
  `);

  // Tabela de Uso de Máquinas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS MachineUsage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machineId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      startTime DATETIME NOT NULL,
      estimatedEndTime DATETIME NOT NULL,
      actualEndTime DATETIME,
      status TEXT NOT NULL DEFAULT 'em_uso' CHECK(status IN ('em_uso', 'concluida', 'cancelada')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (machineId) REFERENCES Machine(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );
  `);

  // Tabela de Fila de Máquinas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS MachineQueue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machineId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      position INTEGER NOT NULL,
      joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      notifiedAt DATETIME,
      expiresAt DATETIME,
      status TEXT NOT NULL DEFAULT 'aguardando' CHECK(status IN ('aguardando', 'notificado', 'expirado', 'cancelado')),
      FOREIGN KEY (machineId) REFERENCES Machine(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );
  `);

  // ===== ÍNDICES PARA PERFORMANCE =====
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_machine_company ON Machine(companyId);
    CREATE INDEX IF NOT EXISTS idx_machine_status ON Machine(status);
    CREATE INDEX IF NOT EXISTS idx_usage_machine ON MachineUsage(machineId);
    CREATE INDEX IF NOT EXISTS idx_usage_user ON MachineUsage(userId);
    CREATE INDEX IF NOT EXISTS idx_usage_status ON MachineUsage(status);
    CREATE INDEX IF NOT EXISTS idx_queue_machine ON MachineQueue(machineId);
    CREATE INDEX IF NOT EXISTS idx_queue_user ON MachineQueue(userId);
    CREATE INDEX IF NOT EXISTS idx_queue_position ON MachineQueue(machineId, position);
  `);

  // Constraint única para evitar usuário duplicado na mesma fila
  await db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_unique_user_machine 
    ON MachineQueue(machineId, userId) 
    WHERE status IN ('aguardando', 'notificado');
  `);

  return db;
}

// Exporta uma instância única do banco de dados
let dbInstance: Awaited<ReturnType<typeof openDb>>;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await openDb();
  }
  return dbInstance;
}