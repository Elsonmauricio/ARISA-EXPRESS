// backend/src/controllers/contactController.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactBody(body: any): string | null {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || name.length > 100) return 'Nome inválido';
  if (!email || !EMAIL_REGEX.test(email)) return 'Email inválido';
  if (phone && phone.length > 30) return 'Telefone inválido';
  if (!message || message.length > 1000) return 'Mensagem inválida';

  return null;
}

export const ContactController = {
  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationError = validateContactBody(req.body);
      if (validationError) {
        return res.status(400).json({ error: 'Dados inválidos', details: validationError });
      }

      const { name, email, phone, message } = req.body;

      await db.collection('leads').add({
        name, email, phone, message,
        createdAt: FieldValue.serverTimestamp(),
        stage: 'NEW',
        assignedTo: null,
        assignedToName: null,
        tags: [],
        notes: []
      });

      res.status(201).json({ success: true, message: 'Mensagem enviada com sucesso' });
    } catch (error) {
      logger.error('Contact error:', error);
      next(error);
    }
  }
};
