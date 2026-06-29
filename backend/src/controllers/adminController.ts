// backend/src/controllers/adminController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '../services/emailService';
import { io } from '../server';
import { logger } from '../utils/logger';

// ============================
//  ESTATÍSTICAS
// ============================
export const AdminController = {
  getStats: async (req: Request, res: Response) => {
    try {
      const [totalShipments, activeShipments, totalUsers] = await Promise.all([
        db.collection('shipments').count().get(),
        db.collection('shipments').where('status', '!=', 'DELIVERED').count().get(),
        db.collection('users').count().get()
      ]);

      res.json({
        success: true,
        data: {
          totalShipments: totalShipments.data().count,
          activeShipments: activeShipments.data().count,
          totalUsers: totalUsers.data().count
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  },

  // ============================
  //  ENCOMENDAS (ADMIN)
  // ============================
  getAllShipments: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('shipments')
        .orderBy('createdAt', 'desc')
        .get();

      const shipments = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });

      res.json({ success: true, data: shipments });
    } catch (error) {
      logger.error('Erro ao buscar encomendas:', error);
      res.status(500).json({ error: 'Erro ao buscar encomendas' });
    }
  },

  getShipmentDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await db.collection('shipments').doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const trackingSnapshot = await db.collection('shipments').doc(id)
        .collection('trackingUpdates')
        .orderBy('timestamp', 'desc')
        .get();

      const trackingUpdates = trackingSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      res.json({
        success: true,
        data: { id: doc.id, ...doc.data(), trackingUpdates }
      });
    } catch (error) {
      logger.error('Erro ao buscar detalhes da encomenda:', error);
      res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
  },

  updateShipmentStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, location, description } = req.body;

      const shipmentDoc = await db.collection('shipments').doc(id).get();
      if (!shipmentDoc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = shipmentDoc.data() as any;
      const trackingCode = shipment.trackingCode;

      // Atualizar status
      const updateData: any = {
        status,
        currentLocation: location || shipment.destination,
        history: FieldValue.arrayUnion({
          status,
          location: location || shipment.destination,
          description: description || `Status atualizado para ${status}`,
          timestamp: new Date().toISOString()
        })
      };

      // Se o status for DELIVERED, registar a data de entrega
      if (status === 'DELIVERED') {
        updateData.actualDelivery = FieldValue.serverTimestamp();
      }

      await db.collection('shipments').doc(id).update(updateData);

      // Adicionar à subcoleção trackingUpdates
      await db.collection('shipments').doc(id).collection('trackingUpdates').add({
        status,
        location: location || shipment.destination,
        description: description || `Status atualizado para ${status}`,
        timestamp: FieldValue.serverTimestamp()
      });

      // Notificar via WebSocket (se houver cliente conectado)
      if (io) {
        io.to(`shipment:${trackingCode}`).emit('tracking-update', {
          trackingCode,
          status,
          location: location || shipment.destination,
          description: description || `Status atualizado para ${status}`,
          timestamp: new Date()
        });
      }

      // Enviar email de notificação ao cliente
      if (shipment.userId) {
        const userDoc = await db.collection('users').doc(shipment.userId).get();
        if (userDoc.exists) {
          const user = userDoc.data() as any;
          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: `📦 Atualização da Encomenda ${trackingCode}`,
              template: 'shipment-updated',
              data: {
                name: user.name || 'Cliente',
                trackingCode,
                status,
                location: location || shipment.destination,
                description: description || `Status atualizado para ${status}`
              }
            });
          }
        }
      }

      res.json({ success: true, message: 'Status atualizado com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  },

  // ============================
  //  UTILIZADORES (ADMIN)
  // ============================
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('users').get();
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        const { password, ...userData } = data; // remover password
        return { id: doc.id, ...userData };
      });

      res.json({ success: true, data: users });
    } catch (error) {
      logger.error('Erro ao buscar utilizadores:', error);
      res.status(500).json({ error: 'Erro ao buscar utilizadores' });
    }
  },

  changeUserRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['ADMIN', 'OPERATOR', 'CLIENT'].includes(role)) {
        return res.status(400).json({ error: 'Role inválida' });
      }

      await db.collection('users').doc(id).update({ role });
      res.json({ success: true, message: 'Permissões atualizadas' });
    } catch (error) {
      logger.error('Erro ao alterar role:', error);
      res.status(500).json({ error: 'Erro ao alterar permissões' });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se o utilizador existe
      const userDoc = await db.collection('users').doc(id).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Utilizador não encontrado' });
      }

      await db.collection('users').doc(id).delete();
      res.json({ success: true, message: 'Utilizador removido' });
    } catch (error) {
      logger.error('Erro ao remover utilizador:', error);
      res.status(500).json({ error: 'Erro ao remover utilizador' });
    }
  },

  // ============================
  //  MENSAGENS DE CONTACTO (LEADS)
  // ============================
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

  markLeadAsRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const leadDoc = await db.collection('leads').doc(id).get();
      if (!leadDoc.exists) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      await db.collection('leads').doc(id).update({
        read: true,
        readAt: FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao marcar lead como lida:', error);
      res.status(500).json({ error: 'Erro ao atualizar mensagem' });
    }
  },

  deleteLead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const leadDoc = await db.collection('leads').doc(id).get();
      if (!leadDoc.exists) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      await db.collection('leads').doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao eliminar lead:', error);
      res.status(500).json({ error: 'Erro ao eliminar mensagem' });
    }
  }
};