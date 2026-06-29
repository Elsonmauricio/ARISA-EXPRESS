// backend/src/controllers/leadController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

export const LeadController = {
  // Listar todas as mensagens (apenas admin)
  getLeads: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('leads')
        .orderBy('createdAt', 'desc')
        .get();

      const leads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      res.json({ success: true, data: leads });
    } catch (error) {
      logger.error('Erro ao buscar leads:', error);
      res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
  },

  // Marcar como lida
  markAsRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.collection('leads').doc(id).update({ read: true });
      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao marcar lead como lida:', error);
      res.status(500).json({ error: 'Erro ao atualizar mensagem' });
    }
  },

  // Eliminar mensagem
  deleteLead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.collection('leads').doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao eliminar lead:', error);
      res.status(500).json({ error: 'Erro ao eliminar mensagem' });
    }
  }
};