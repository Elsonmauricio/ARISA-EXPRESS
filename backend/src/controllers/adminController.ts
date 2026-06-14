// backend/src/controllers/adminController.ts
import { Request, Response } from 'express';
import { db, admin } from '../config/firebase';
import { sendEmail } from '../services/emailService';
import { io } from '../server';

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
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  },
  
  getAllShipments: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('shipments')
        .orderBy('createdAt', 'desc')
        .get();
      
      const shipments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      res.json({ success: true, data: shipments });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar encomendas' });
    }
  },
  
  updateShipmentStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, location, description } = req.body;
      
      const shipmentDoc = await db.collection('shipments').doc(id).get();
      if (!shipmentDoc.exists) return res.status(404).json({ error: 'Encomenda não encontrada' });
      
      const shipment = shipmentDoc.data();
      
      const updateData: any = {
        status,
        currentLocation: location,
        history: admin.firestore.FieldValue.arrayUnion({
          status,
          location,
          description,
          timestamp: new Date().toISOString()
        })
      };

      if (status === 'DELIVERED') {
        updateData.actualDelivery = admin.firestore.FieldValue.serverTimestamp();
      }

      await db.collection('shipments').doc(id).update(updateData);
      
      await db.collection('shipments').doc(id).collection('trackingUpdates').add({
        status,
        location,
        description,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      if (io) {
        io.to(`shipment:${shipment?.trackingCode}`).emit('tracking-update', {
          trackingCode: shipment?.trackingCode,
          status, location, description, timestamp: new Date()
        });
      }
      
      if (shipment?.userId) {
        const userDoc = await db.collection('users').doc(shipment.userId).get();
        if (userDoc.exists) {
          const user = userDoc.data();
          await sendEmail({
            to: user?.email,
            subject: `Atualização da Encomenda ${shipment?.trackingCode}`,
            template: 'shipment-updated',
            data: { trackingCode: shipment?.trackingCode, status, location, description, name: user?.name }
          });
        }
      }
      
      res.json({ success: true, message: 'Status atualizado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  },
  
  getShipmentDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await db.collection('shipments').doc(id).get();
      
      if (!doc.exists) return res.status(404).json({ error: 'Encomenda não encontrada' });
      
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
      res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
  },
  
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('users').get();
      const users = snapshot.docs.map(doc => {
        const { password, ...userData } = doc.data();
        return { id: doc.id, ...userData };
      });

      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar utilizadores' });
    }
  },
  
  changeUserRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      await db.collection('users').doc(id).update({ role });
      res.json({ success: true, message: 'Permissões atualizadas' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao alterar role' });
    }
  },
  
  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.collection('users').doc(id).delete();
      res.json({ success: true, message: 'Utilizador removido' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover utilizador' });
    }
  }
};