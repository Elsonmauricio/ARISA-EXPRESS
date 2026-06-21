// backend/src/controllers/shipmentController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { generateTrackingCode } from '../utils/trackingCode';
import { sendEmail } from '../services/emailService';
import { io } from '../server';
import { logger } from '../utils/logger';

export const ShipmentController = {
  createShipment: async (req: Request, res: Response) => {
    try {
      const {
        origin, destination, senderName, senderPhone,
        receiverName, receiverPhone, weight, dimensions, description, serviceType
      } = req.body;
      const user = (req as any).user;

      // Verificar se a rota existe e tem capacidade
      const routeQuery = await db.collection('routes')
        .where('origin', '==', origin)
        .where('destination', '==', destination)
        .where('serviceType', '==', serviceType)
        .limit(1)
        .get();

      if (routeQuery.empty) {
        return res.status(400).json({ error: 'Rota não encontrada' });
      }

      const routeDoc = routeQuery.docs[0];
      const routeData = routeDoc.data();
      const available = (routeData.capacity || 0) - (routeData.reserved || 0);
      const weightNum = parseFloat(weight);

      if (available < weightNum) {
        return res.status(400).json({
          error: `Capacidade insuficiente. Disponível: ${available} kg`
        });
      }

      // Atualizar reserva da rota
      await db.collection('routes').doc(routeDoc.id).update({
        reserved: FieldValue.increment(weightNum)
      });

      // Gerar código e preço
      const trackingCode = generateTrackingCode();
      const price = ShipmentController.calculatePrice(weightNum, serviceType);

      const shipmentData = {
        trackingCode,
        origin,
        destination,
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        weight: weightNum,
        dimensions: dimensions || {},
        description: description || '',
        serviceType,
        price,
        userId: user.id,
        routeId: routeDoc.id,
        status: 'PENDING',
        createdAt: FieldValue.serverTimestamp(),
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
        timestamp: FieldValue.serverTimestamp()
      });

      // Enviar email com todos os detalhes
      await sendEmail({
        to: user.email,
        subject: `✅ Encomenda Registada - ${trackingCode}`,
        template: 'shipment-created',
        data: {
          name: user.name,
          trackingCode,
          origin,
          destination,
          senderName,
          senderPhone,
          receiverName,
          receiverPhone,
          weight: weightNum,
          dimensions: dimensions || {},
          description: description || 'N/A',
          serviceType: serviceType.replace('_', ' '),
          price
        }
      });

      res.status(201).json({ success: true, data: { id: docRef.id, ...shipmentData } });
    } catch (error) {
      logger.error('Erro ao criar encomenda:', error);
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
      logger.error('Erro ao buscar encomendas:', error);
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
      logger.error('Erro ao buscar encomenda:', error);
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
      logger.error('Erro ao atualizar encomenda:', error);
      res.status(500).json({ error: 'Erro ao atualizar encomenda' });
    }
  },

  deleteShipment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.collection('shipments').doc(id).delete();
      res.json({ success: true, message: 'Encomenda removida' });
    } catch (error) {
      logger.error('Erro ao remover encomenda:', error);
      res.status(500).json({ error: 'Erro ao remover encomenda' });
    }
  },

  cancelShipment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = doc.data() as any;
      await db.collection('shipments').doc(id).update({ status: 'CANCELLED' });

      // Libertar capacidade da rota
      if (shipment.routeId) {
        await db.collection('routes').doc(shipment.routeId).update({
          reserved: FieldValue.increment(-shipment.weight)
        });
      }

      // Notificar via WebSocket
      if (io) {
        io.to(`shipment:${shipment.trackingCode}`).emit('tracking-update', {
          trackingCode: shipment.trackingCode,
          status: 'CANCELLED'
        });
      }

      // Enviar email de cancelamento
      const userDoc = await db.collection('users').doc(shipment.userId).get();
      const user = userDoc.data();
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `❌ Encomenda Cancelada - ${shipment.trackingCode}`,
          template: 'shipment-cancelled',
          data: {
            name: user.name,
            trackingCode: shipment.trackingCode,
            origin: shipment.origin,
            destination: shipment.destination
          }
        });
      }

      res.json({ success: true, message: 'Encomenda cancelada' });
    } catch (error) {
      logger.error('Erro ao cancelar encomenda:', error);
      res.status(500).json({ error: 'Erro ao cancelar encomenda' });
    }
  },

  calculatePrice: (weight: number, pricePerKg: number): number => {
  const total = pricePerKg * weight;
  return Math.round(total * 100) / 100;
}
};