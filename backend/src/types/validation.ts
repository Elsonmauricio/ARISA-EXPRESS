// backend/src/types/validation.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
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
    serviceType: z.enum(['AIR_EXPRESS', 'AIR_ECONOMY', 'MARITIME', 'BUSINESS'])
  })
});