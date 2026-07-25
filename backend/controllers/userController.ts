// backend/src/controllers/userController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import bcrypt from 'bcryptjs';
import { FieldValue } from 'firebase-admin/firestore';

export const UserController = {
  getProfile: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }
      const data = userDoc.data();
      const { password, ...userData } = data || {};
      res.json({ success: true, data: { id: userDoc.id, ...userData } });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },
  
  updateProfile: async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const updateData: Record<string, string> = {};

      if (body.name !== undefined) {
        const name = String(body.name).trim();
        if (name.length < 2 || name.length > 100) {
          return res.status(400).json({ error: 'Dados inválidos' });
        }
        updateData.name = name;
      }
      if (body.phone !== undefined) {
        const phone = String(body.phone).trim();
        if (phone.length > 30) {
          return res.status(400).json({ error: 'Dados inválidos' });
        }
        updateData.phone = phone;
      }
      if (body.company !== undefined) {
        const company = String(body.company).trim();
        if (company.length > 100) {
          return res.status(400).json({ error: 'Dados inválidos' });
        }
        updateData.company = company;
      }

      const userId = (req as any).user.id;
      await db.collection('users').doc(userId).update(updateData);
      res.json({ success: true, message: 'Perfil atualizado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },

  changePassword: async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || String(newPassword).length < 10) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 10 caracteres' });
      }
      const userId = (req as any).user.id;
      const userDoc = await db.collection('users').doc(userId).get();
      const user = userDoc.data();
      const isValid = await bcrypt.compare(currentPassword, user?.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.collection('users').doc(userId).update({ password: hashedPassword });
      res.json({ success: true, message: 'Senha alterada com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  },
  
  getNotifications: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const snapshot = await db.collection('users').doc(userId).collection('notifications')
        .orderBy('createdAt', 'desc')
        .get();
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: notifications });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
  },
  
  markNotificationRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      await db.collection('users').doc(userId).collection('notifications').doc(id).update({ read: true });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
    }
  }
};