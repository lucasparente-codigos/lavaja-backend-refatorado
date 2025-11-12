import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  // Prisma unique constraint error
  if (err.code === 'P2002') {
    return res.status(400).json({ 
      success: false,
      error: 'Email já cadastrado',
      field: 'email' 
    });
  }
  
  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ 
      success: false,
      error: 'Registro não encontrado' 
    });
  }
  
  // Validation error
  if (err.isJoi) {
    return res.status(400).json({ 
      success: false,
      error: 'Dados inválidos',
      details: err.details 
    });
  }
  
  // Default error
  res.status(500).json({ 
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
