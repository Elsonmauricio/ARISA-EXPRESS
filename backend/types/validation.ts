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
    serviceType: z.enum(['REDIRECT', 'COURIER', 'PERSONAL_SHOPPER', 'BUSINESS'])
  })
});

export const adminCreateShipmentSchema = z.object({
  body: z.object({
    trackingCode: z.string().min(3).optional(),
    origin: z.string().min(2),
    destination: z.string().min(2),
    route: z.string().min(2).optional(),
    senderName: z.string().min(2),
    senderContact: z.string().optional(),
    senderPhone: z.string().optional(),
    receiverName: z.string().min(2),
    receiverContact: z.string().optional(),
    receiverPhone: z.string().optional(),
    weight: z.number().positive(),
    category: z.string().optional(),
    freightValue: z.number().nonnegative().optional(),
    price: z.number().nonnegative().optional(),
    paymentStatus: z.enum(['PAID', 'PENDING']).optional(),
    serviceType: z.enum(['REDIRECT', 'COURIER', 'PERSONAL_SHOPPER', 'BUSINESS']).optional(),
    status: z.enum(['REGISTERED', 'SHIPPED', 'IN_CUSTOMS', 'READY_FOR_PICKUP', 'PICKED_UP', 'PENDING', 'COLLECTED', 'IN_TRANSIT', 'CUSTOMS', 'IN_PORTUGAL', 'IN_ANGOLA', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
    description: z.string().optional(),
    cttCode: z.string().optional(),
    cttLink: z.string().url().optional().or(z.literal(''))
  })
});

export const updateCttSchema = z.object({
  body: z.object({
    cttCode: z.string().optional(),
    cttLink: z.string().url().optional().or(z.literal(''))
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().max(30).optional(),
    company: z.string().max(100).optional()
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(10).max(128)
  })
});
