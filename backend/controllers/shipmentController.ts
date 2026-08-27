// backend/src/controllers/shipmentController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { generateTrackingCode } from '../utils/trackingCode';
import { fixEncodingObject } from '../utils/encoding';
import { sendEmail } from '../services/emailService';
import { logger } from '../utils/logger';

export const ShipmentController = {
  createShipment: async (req: Request, res: Response) => {
    try {
      const {
        origin, destination, senderName, senderPhone,
        receiverName, receiverPhone, weight, dimensions, description, serviceType
      } = req.body;
      const user = (req as any).user;

      if (!user || !user.id) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Verificar rota
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

      // Atualizar reserva
      await db.collection('routes').doc(routeDoc.id).update({
        reserved: FieldValue.increment(weightNum)
      });

      const trackingCode = generateTrackingCode();
      const price = routeData.pricePerKg * weightNum; // sem taxas

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

      // Enviar email para remetente e destinatário
      const recipients = Array.from(
        new Set(
          [user.email].filter(
            (email): email is string => Boolean(email) && email.includes('@')
          )
        )
      );

      if (recipients.length > 0) {
        try {
          await Promise.allSettled(
            recipients.map(to =>
              sendEmail({
                to,
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
              })
            )
          );
        } catch (emailError: any) {
          logger.error('Erro ao enviar email de notificação de encomenda criada:', emailError);
        }
      }

      res.status(201).json({ success: true, data: { id: docRef.id, ...shipmentData } });
    } catch (error: any) {
      logger.error('Erro ao criar encomenda:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao criar encomenda' });
    }
  },

  getUserShipments: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const userId = user.id;
      logger.info(`Buscando encomendas para o utilizador: ${userId}`);

      let snapshot;
      try {
        snapshot = await db.collection('shipments')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();
      } catch (indexErr: any) {
        if (indexErr?.message && indexErr.message.includes('requires an index')) {
          logger.warn('Índice composto em falta; a usar fallback sem orderBy para userId=' + userId);
          snapshot = await db.collection('shipments').where('userId', '==', userId).get();
        } else {
          throw indexErr;
        }
      }

      const shipments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.toDate?.()?.getTime?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.toDate?.()?.getTime?.() ?? 0;
          return tb - ta;
        });

logger.info(`Encontradas ${shipments.length} encomendas para o utilizador ${userId}`);
       res.json({ success: true, data: fixEncodingObject(shipments) });
    } catch (error: any) {
      logger.error('Erro ao buscar encomendas:', error.message, error.stack);
      if (error.message && error.message.includes('requires an index')) {
        return res.status(500).json({
          error: 'O índice do Firestore ainda não está pronto. Aguarde alguns minutos e tente novamente.'
        });
      }
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
      const docData = doc.data() as any;
      const statusCalculado = docData?.status_proprio ?? docData?.status ?? null;
      const shipment = { id: doc.id, ...docData, status_calculado: statusCalculado } as any;
      const user = (req as any).user;
      if (shipment.userId !== user.id && user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      res.json({ success: true, data: fixEncodingObject(shipment) });
    } catch (error: any) {
      logger.error('Erro ao buscar encomenda:', error);
      res.status(500).json({ error: 'Erro ao buscar encomenda' });
    }
  },

  updateShipment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }
      if (doc.data()?.userId !== user.id && user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const allowedFields = [
        'status', 'trackingCode', 'origin', 'destination', 'weight',
        'price', 'serviceType', 'flightDate', 'description',
        'senderName', 'senderPhone', 'recipientName', 'recipientPhone',
        'length', 'width', 'height'
      ];
      const filteredUpdates: any = {};
      for (const key of allowedFields) {
        if (key in req.body) {
          filteredUpdates[key] = req.body[key];
        }
      }
      if ('weight' in filteredUpdates) {
        filteredUpdates.weight = parseFloat(filteredUpdates.weight);
      }

      await db.collection('shipments').doc(id).update(filteredUpdates);
      res.json({ success: true, message: 'Encomenda atualizada' });
    } catch (error: any) {
      logger.error('Erro ao atualizar encomenda:', error);
      res.status(500).json({ error: 'Erro ao atualizar encomenda' });
    }
  },

  deleteShipment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }
      if (doc.data()?.userId !== user.id && user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      await db.collection('shipments').doc(id).delete();
      res.json({ success: true, message: 'Encomenda removida' });
    } catch (error: any) {
      logger.error('Erro ao remover encomenda:', error);
      res.status(500).json({ error: 'Erro ao remover encomenda' });
    }
  },

  cancelShipment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }
      if (doc.data()?.userId !== user.id && user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const shipment = doc.data() as any;
      await db.collection('shipments').doc(id).update({ status: 'CANCELLED' });

      // Libertar capacidade da rota
      if (shipment.routeId) {
        await db.collection('routes').doc(shipment.routeId).update({
          reserved: FieldValue.increment(-shipment.weight)
        });
      }

      // Enviar email de cancelamento para remetente e destinatário
      const recipients = Array.from(
        new Set(
          [shipment.senderContact, shipment.receiverContact].filter(
            (email): email is string => Boolean(email) && email.includes('@')
          )
        )
      );

      if (recipients.length > 0) {
        try {
          await Promise.allSettled(
            recipients.map(to =>
              sendEmail({
                to,
                subject: `❌ Encomenda Cancelada - ${shipment.trackingCode}`,
                template: 'shipment-cancelled',
                data: {
                  name: shipment.senderName || shipment.receiverName || 'Cliente',
                  trackingCode: shipment.trackingCode,
                  origin: shipment.origin,
                  destination: shipment.destination
                }
              })
            )
          );
        } catch (emailError: any) {
          logger.error('Erro ao enviar email de cancelamento:', emailError);
        }
      }

      res.json({ success: true, message: 'Encomenda cancelada' });
    } catch (error: any) {
      logger.error('Erro ao cancelar encomenda:', error);
      res.status(500).json({ error: 'Erro ao cancelar encomenda' });
    }
  }
};