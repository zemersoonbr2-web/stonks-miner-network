import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, { message: "A mensagem não pode estar vazia" })
    .max(500, { message: "A mensagem deve ter no máximo 500 caracteres" })
    .refine((val) => !/<script|javascript:|onerror=/i.test(val), {
      message: "Conteúdo inválido detectado"
    })
});

export const nicknameSchema = z.object({
  nickname: z.string()
    .trim()
    .min(3, { message: "O apelido deve ter no mínimo 3 caracteres" })
    .max(20, { message: "O apelido deve ter no máximo 20 caracteres" })
    .regex(/^[a-zA-Z0-9_]+$/, { 
      message: "O apelido deve conter apenas letras, números e underscore" 
    })
});

export const phoneSchema = z.object({
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, { 
      message: "Formato de telefone inválido" 
    })
    .optional()
    .or(z.literal(''))
});
