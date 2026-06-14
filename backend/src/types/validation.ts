// backend/src/types/validation.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    phone: z.string().optional(),
    company: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
});

export const createShipmentSchema = z.object({
  body: z.object({
    origin: z.string().min(2),
    destination: z.string().min(2),
    senderName: z.string().min(2),
    senderPhone: z.string(),
    receiverName: z.string().min(2),
    receiverPhone: z.string(),
    weight: z.number().positive(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive()
    }).optional(),
    description: z.string().optional(),
    serviceType: z.enum(['AIR_EXPRESS', 'AIR_ECONOMY', 'MARITIME', 'BUSINESS'])
  })
});

export const updateShipmentSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'COLLECTED', 'IN_TRANSIT', 'CUSTOMS', 'IN_PORTUGAL', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
    currentLocation: z.string().optional(),
    description: z.string().optional()
  })
});

export const quotationSchema = z.object({
  body: z.object({
    origin: z.string(),
    destination: z.string(),
    weight: z.number().positive(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive()
    }).optional(),
    serviceType: z.enum(['AIR_EXPRESS', 'AIR_ECONOMY', 'MARITIME', 'BUSINESS'])
  })
});