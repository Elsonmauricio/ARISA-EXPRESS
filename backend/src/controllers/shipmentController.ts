// backend/src/controllers/shipmentController.ts
import { Request, Response } from 'express';
import { db, admin } from '../config/firebase';
import { generateTrackingCode } from '../utils/trackingCode';
import { sendEmail } from '../services/emailService';
import { io } from '../server';

export const ShipmentController = {
  createShipment: async (req: Request, res: Response) => {
    try {
      const {
        origin, destination, senderName, senderPhone,
        receiverName, receiverPhone, weight, dimensions, description, serviceType
      } = req.body;
      const user = (req as any).user;
      
      const trackingCode = generateTrackingCode();
      const price = ShipmentController.calculatePrice(weight, serviceType);
      
      const shipmentData = {
        trackingCode,
        origin,
        destination,
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        weight: parseFloat(weight),
        dimensions: dimensions || {},
        description,
        serviceType,
        price,
        userId: user.id,
        status: 'PENDING',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        history: [{
          status: 'PENDING',
          location: origin,
          description: 'Encomenda registada no sistema',
          timestamp: new Date().toISOString()
        }]
      };

      const docRef = await db.collection('shipments').add(shipmentData);

      await db.collection('shipments').doc(docRef.id).collection('trackingUpdates').add({
        status: 'PENDING',
        location: origin,
        description: 'Encomenda registada aguardando recolha',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await sendEmail({
        to: user.email,
        subject: `Encomenda Registada - ${trackingCode}`,
        template: 'shipment-created',
        data: { trackingCode, origin, destination, price, name: user.name }
      });
      
      res.status(201).json({ success: true, data: { id: docRef.id, ...shipmentData } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao criar encomenda' });
    }
  },
  
  getUserShipments: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const snapshot = await db.collection('shipments')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const shipments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      res.json({ success: true, data: shipments });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar encomendas' });
    }
  },
  
  getShipmentById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await db.collection('shipments').doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = { id: doc.id, ...doc.data() } as any;
      const user = (req as any).user;
      
      if (shipment.userId !== user.id && user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      
      res.json({ success: true, data: shipment });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar encomenda' });
    }
  },
  
  updateShipment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      await db.collection('shipments').doc(id).update(updates);
      res.json({ success: true, message: 'Encomenda atualizada' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar encomenda' });
    }
  },
  
  deleteShipment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.collection('shipments').doc(id).delete();
      res.json({ success: true, message: 'Encomenda removida' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover encomenda' });
    }
  },
  
  cancelShipment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await db.collection('shipments').doc(id).get();
      
      if (!doc.exists) return res.status(404).json({ error: 'Encomenda não encontrada' });
      
      const shipment = doc.data();
      await db.collection('shipments').doc(id).update({ status: 'CANCELLED' });
      
      if (io) {
        io.to(`shipment:${shipment?.trackingCode}`).emit('tracking-update', {
          trackingCode: shipment?.trackingCode,
          status: 'CANCELLED'
        });
      }
      
      res.json({ success: true, message: 'Encomenda cancelada' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao cancelar encomenda' });
    }
  },
  
  calculatePrice: (weight: number, serviceType: string): number => {
    const rates: Record<string, number> = { AIR_EXPRESS: 25, AIR_ECONOMY: 15, MARITIME: 5, BUSINESS: 35 };
    const minPrices: Record<string, number> = { AIR_EXPRESS: 50, AIR_ECONOMY: 35, MARITIME: 20, BUSINESS: 100 };
    let price = rates[serviceType] * weight;
    price = Math.max(price, minPrices[serviceType]);
    return Math.round(price * 100) / 100;
  }
};