// backend/src/utils/validation.ts
import Joi from 'joi';

// ===== SCHEMAS EXISTENTES =====
export const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 50 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(6).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'string.pattern.base': 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número',
    'any.required': 'Senha é obrigatória'
  })
});

export const companySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome da empresa deve ter pelo menos 2 caracteres',
    'string.max': 'Nome da empresa deve ter no máximo 100 caracteres',
    'any.required': 'Nome da empresa é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  }),
  cnpj: Joi.string().pattern(/^\d{14}$/).required().messages({
    'string.pattern.base': 'CNPJ deve conter exatamente 14 dígitos',
    'any.required': 'CNPJ é obrigatório'
  }),
  password: Joi.string().min(6).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'string.pattern.base': 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número',
    'any.required': 'Senha é obrigatória'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Senha é obrigatória'
  })
});

// ===== NOVOS SCHEMAS =====

export const machineSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Nome da máquina deve ter pelo menos 2 caracteres',
    'string.max': 'Nome da máquina deve ter no máximo 50 caracteres',
    'any.required': 'Nome da máquina é obrigatório'
  }),
  type: Joi.string().valid('lavadora', 'secadora').required().messages({
    'any.only': 'Tipo deve ser "lavadora" ou "secadora"',
    'any.required': 'Tipo é obrigatório'
  }),
  defaultDuration: Joi.number().integer().min(5).max(180).required().messages({
    'number.base': 'Duração deve ser um número',
    'number.integer': 'Duração deve ser um número inteiro',
    'number.min': 'Duração mínima é 5 minutos',
    'number.max': 'Duração máxima é 180 minutos (3 horas)',
    'any.required': 'Duração padrão é obrigatória'
  })
});

export const machineUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).messages({
    'string.min': 'Nome da máquina deve ter pelo menos 2 caracteres',
    'string.max': 'Nome da máquina deve ter no máximo 50 caracteres'
  }),
  type: Joi.string().valid('lavadora', 'secadora').messages({
    'any.only': 'Tipo deve ser "lavadora" ou "secadora"'
  }),
  defaultDuration: Joi.number().integer().min(5).max(180).messages({
    'number.base': 'Duração deve ser um número',
    'number.integer': 'Duração deve ser um número inteiro',
    'number.min': 'Duração mínima é 5 minutos',
    'number.max': 'Duração máxima é 180 minutos (3 horas)'
  }),
  status: Joi.string().valid('disponivel', 'em_uso', 'manutencao').messages({
    'any.only': 'Status deve ser "disponivel", "em_uso" ou "manutencao"'
  })
}).min(1).messages({
  'object.min': 'Pelo menos um campo deve ser informado para atualização'
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details.map((detail: any) => detail.message)
      });
    }
    next();
  };
};