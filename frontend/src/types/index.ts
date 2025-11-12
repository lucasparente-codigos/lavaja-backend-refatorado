// src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  type: 'user' | 'company';
  cnpj?: string;
}

export interface Machine {
  id: number;
  name: string;
  type: 'lavadora' | 'secadora';
  status: 'disponivel' | 'em_uso' | 'manutencao';
  defaultDuration: number;
}

export interface MachineStats {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
}
