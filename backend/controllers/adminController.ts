// backend/src/controllers/adminController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '../services/emailService';
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

  searchShipments: async (req: Request, res: Response) => {
    try {
      const { q, status } = req.query;
      let query: any = db.collection('shipments');

      if (status && status !== 'all') {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      let shipments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      if (q && typeof q === 'string') {
        const term = q.toLowerCase();
        shipments = shipments.filter((s: any) =>
          (s.trackingCode || '').toLowerCase().includes(term) ||
          (s.senderName || '').toLowerCase().includes(term) ||
          (s.receiverName || '').toLowerCase().includes(term)
        );
      }

      shipments.sort((a: any, b: any) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.toDate?.()?.getTime?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.toDate?.()?.getTime?.() ?? 0;
        return tb - ta;
      });

      res.json({ success: true, data: shipments });
    } catch (error) {
      logger.error('Erro ao pesquisar encomendas:', error);
      res.status(500).json({ error: 'Erro ao pesquisar encomendas' });
    }
  },

  createShipment: async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const user = (req as any).user;

      const trackingCode = body.trackingCode || `AE-${new Date().getFullYear()}-${require('crypto').randomBytes(2).toString('hex').toUpperCase()}`;
      const route = body.route || `${body.origin} » ${body.destination}`;

      const shipmentData: any = {
        trackingCode,
        status: body.status || 'REGISTERED',
        origin: body.origin,
        destination: body.destination,
        route,
        senderName: body.senderName,
        senderContact: body.senderContact || '',
        senderPhone: body.senderPhone || '',
        receiverName: body.receiverName,
        receiverContact: body.receiverContact || '',
        receiverPhone: body.receiverPhone || '',
        weight: parseFloat(body.weight) || 0,
        category: body.category || '',
        freightValue: body.freightValue ? parseFloat(body.freightValue) : 0,
        price: body.price ? parseFloat(body.price) : 0,
        paymentStatus: body.paymentStatus || 'PENDING',
        description: body.description || '',
        serviceType: body.serviceType || 'REDIRECT',
        cttCode: body.cttCode || '',
        cttLink: body.cttLink || '',
        createdAt: FieldValue.serverTimestamp(),
        history: [{
          status: body.status || 'REGISTERED',
          location: body.origin,
          description: 'Encomenda registada pela equipa',
          timestamp: new Date().toISOString()
        }]
      };

      if (user?.id) {
        shipmentData.userId = user.id;
      }

      const docRef = await db.collection('shipments').add(shipmentData);

      await db.collection('shipments').doc(docRef.id).collection('trackingUpdates').add({
        status: body.status || 'REGISTERED',
        location: body.origin,
        description: 'Encomenda registada pela equipa',
        timestamp: FieldValue.serverTimestamp()
      });

      res.status(201).json({ success: true, data: { id: docRef.id, ...shipmentData } });
    } catch (error: any) {
      logger.error('Erro ao criar encomenda (admin):', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao criar encomenda' });
    }
  },

  updateCtt: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { cttCode, cttLink } = req.body;

      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const updateData: any = {};
      if (cttCode !== undefined) updateData.cttCode = cttCode;
      if (cttLink !== undefined) updateData.cttLink = cttLink;

      await db.collection('shipments').doc(id).update(updateData);
      res.json({ success: true, message: 'CTT atualizado com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar CTT:', error);
      res.status(500).json({ error: 'Erro ao atualizar CTT' });
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