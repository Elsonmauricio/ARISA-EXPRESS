// backend/src/controllers/contactController.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';

export const ContactController = {
  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, message } = req.body;
      
      await db.collection('leads').add({
        name, email, phone, message,
        createdAt: FieldValue.serverTimestamp(),
        status: 'NEW'
      });

      res.status(201).json({ success: true, message: 'Mensagem enviada com sucesso' });
    } catch (error) {
      logger.error('Contact error:', error);
      next(error);
    }
  }
};