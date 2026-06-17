// backend/src/controllers/userController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import bcrypt from 'bcryptjs';

export const UserController = {
  getProfile: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

      const [shipmentsCount, quotationsCount] = await Promise.all([
        db.collection('shipments').where('userId', '==', userId).count().get(),
        db.collection('quotations').where('userId', '==', userId).count().get()
      ]);

      const data = userDoc.data();
      const { password, ...userData } = data || {};

      res.json({
        success: true,
        data: {
          id: userDoc.id,
          ...userData,
          _count: {
            shipments: shipmentsCount.data().count,
            quotations: quotationsCount.data().count
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },
  
  updateProfile: async (req: Request, res: Response) => {
    try {
      const { name, phone, company } = req.body;
      const userId = (req as any).user.id;
      
      await db.collection('users').doc(userId).update({ name, phone, company });
      res.json({ success: true, message: 'Perfil atualizado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },
  
  changePassword: async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
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