// backend/src/controllers/leadController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';

export const LEAD_STAGES = ['NEW','CONTACTED','QUALIFIED','PROPOSAL','WON','LOST'] as const;

export const LeadController = {
  // Listar todas as mensagens (apenas admin)
  getLeads: async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const cursor = req.query.cursor as string | undefined;
      const { stage, assignedTo, tag } = req.query;

      let query: FirebaseFirestore.Query = db.collection('leads');

      if (stage) query = query.where('stage', '==', stage as string);
      if (assignedTo) query = query.where('assignedTo', '==', assignedTo as string);
      if (tag) query = query.where('tags', 'array-contains', tag as string);

      query = query.orderBy('createdAt', 'desc').limit(limit);

      if (cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
          const cursorDoc = await db.collection('leads').doc(decoded.id).get();
          if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
          }
        } catch {
          // ignore invalid cursor
        }
      }

      const snapshot = await query.get();
      const leads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const nextCursor = lastDoc
        ? Buffer.from(JSON.stringify({ id: lastDoc.id, createdAt: lastDoc.data().createdAt?.toMillis?.() || Date.now() })).toString('base64')
        : null;

      const totalSnapshot = await db.collection('leads').count().get();

      res.json({
        success: true,
        data: leads,
        pagination: {
          total: totalSnapshot.data().count,
          limit,
          hasMore: snapshot.size === limit,
          nextCursor
        }
      });
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
      const doc = await db.collection('leads').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Lead não encontrado' });
      }
      await db.collection('leads').doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao eliminar lead:', error);
      res.status(500).json({ error: 'Erro ao eliminar mensagem' });
    }
  },

  getLeadPipeline: async (_req: Request, res: Response) => {
    try {
      const counts: Record<string, number> = {};
      for (const stage of LEAD_STAGES) counts[stage] = 0;

      const snapshot = await db.collection('leads').get();
      snapshot.docs.forEach(doc => {
        const stage = doc.data().stage;
        if (stage in counts) counts[stage] += 1;
      });

      res.json({ success: true, data: counts });
    } catch (error) {
      logger.error('Erro ao buscar pipeline:', error);
      res.status(500).json({ error: 'Erro ao buscar pipeline' });
    }
  },

  updateLeadStage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { stage } = req.body;

      if (!LEAD_STAGES.includes(stage as typeof LEAD_STAGES[number])) {
        return res.status(400).json({ error: 'Estágio inválido' });
      }

      const doc = await db.collection('leads').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Lead não encontrado' });
      }

      const update: Record<string, any> = { stage };
      if (stage === 'WON') {
        update.convertedAt = FieldValue.serverTimestamp();
      }

      await db.collection('leads').doc(id).update(update);
      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao atualizar estágio:', error);
      res.status(500).json({ error: 'Erro ao atualizar estágio' });
    }
  },

  assignLead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { assignedTo, assignedToName } = req.body;

      const doc = await db.collection('leads').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Lead não encontrado' });
      }

      await db.collection('leads').doc(id).update({
        assignedTo: assignedTo ?? null,
        assignedToName: assignedToName ?? null
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao atribuir lead:', error);
      res.status(500).json({ error: 'Erro ao atribuir lead' });
    }
  },

  updateLeadTags: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { tags } = req.body;

      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: 'Tags devem ser um array' });
      }

      const doc = await db.collection('leads').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Lead não encontrado' });
      }

      await db.collection('leads').doc(id).update({ tags });
      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao atualizar tags:', error);
      res.status(500).json({ error: 'Erro ao atualizar tags' });
    }
  },

  addLeadNote: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Texto da nota é obrigatório' });
      }

      const doc = await db.collection('leads').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Lead não encontrado' });
      }

      const note = {
        id: crypto.randomUUID(),
        text,
        author: req.user?.name || req.user?.email || 'Sistema',
        authorId: req.user?.id || null,
        createdAt: FieldValue.serverTimestamp()
      };

      await db.collection('leads').doc(id).update({
        notes: FieldValue.arrayUnion(note)
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao adicionar nota:', error);
      res.status(500).json({ error: 'Erro ao adicionar nota' });
    }
  }
};
