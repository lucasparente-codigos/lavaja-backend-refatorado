// backend/src/controllers/companyController.ts
import { Request, Response } from 'express';
import { hashPassword } from '../utils/password';
import { successResponse, errorResponse } from '../utils/response';
import { CompanyModel } from '../models/Company';

export const registerCompany = async (req: Request, res: Response) => {
  try {
    let { name, email, cnpj, password } = req.body;
    
    // Remover formatação do CNPJ (pontos, barras e hífens)
    cnpj = cnpj.replace(/\D/g, '');
    
    // Verificar se empresa já existe por email
    const existingCompanyByEmail = await CompanyModel.findByEmail(email);
    if (existingCompanyByEmail) {
      return res.status(400).json(errorResponse('Email já cadastrado'));
    }

    // Verificar se empresa já existe por CNPJ
    const existingCompanyByCnpj = await CompanyModel.findByCnpj(cnpj);
    if (existingCompanyByCnpj) {
      return res.status(400).json(errorResponse('CNPJ já cadastrado'));
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar empresa
    const company = await CompanyModel.create({ 
      name, 
      email, 
      cnpj, 
      password: hashedPassword 
    });

    // Remover a senha do objeto de retorno
    const { password: _, ...companyWithoutPassword } = company;

    res.status(201).json(successResponse(companyWithoutPassword, 'Empresa registrada com sucesso'));
  } catch (err: any) {
    console.error('Erro ao registrar empresa:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

export const listCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await CompanyModel.findAll();
    res.json(successResponse(companies, 'Lista de empresas recuperada com sucesso'));
  } catch (err: any) {
    console.error('Erro ao listar empresas:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = parseInt(id, 10);

    if (isNaN(companyId)) {
      return res.status(400).json(errorResponse('ID de empresa inválido'));
    }

    const deleted = await CompanyModel.delete(companyId);

    if (deleted) {
      res.json(successResponse(null, 'Empresa deletada com sucesso'));
    } else {
      res.status(404).json(errorResponse('Empresa não encontrada'));
    }
  } catch (err: any) {
    console.error('Erro ao deletar empresa:', err);
    res.status(500).json(errorResponse('Erro interno do servidor'));
  }
};
