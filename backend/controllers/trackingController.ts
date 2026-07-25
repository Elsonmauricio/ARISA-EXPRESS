// backend/src/controllers/trackingController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

export const TrackingController = {
  /**
   * Obtém informações de rastreamento de uma encomenda pelo código
   * @route GET /api/tracking/:code
   */
  getTrackingInfo: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;

      if (!code || code.trim() === '') {
        return res.status(400).json({ error: 'Código de rastreio inválido' });
      }

      // Buscar a encomenda pelo código
      const snapshot = await db.collection('shipments')
        .where('trackingCode', '==', code.trim().toUpperCase())
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipmentDoc = snapshot.docs[0];
      const shipment = shipmentDoc.data();

      // Buscar o histórico de tracking
      const trackingSnapshot = await db.collection('shipments')
        .doc(shipmentDoc.id)
        .collection('trackingUpdates')
        .orderBy('timestamp', 'desc')
        .get();

      const trackingUpdates = trackingSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.status || 'PENDING',
          location: data.location || 'N/A',
          description: data.description || '',
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
        };
      });

      // Construir resposta com dados completos + datas de cada etapa
      const responseData = {
        trackingCode: shipment.trackingCode || code,
        origin: shipment.origin || 'N/A',
        destination: shipment.destination || 'N/A',
        weight: shipment.weight || 0,
        price: shipment.price || 0,
        status: shipment.status || 'PENDING',
        senderName: shipment.senderName || 'N/A',
        receiverName: shipment.receiverName || 'N/A',
        createdAt: shipment.createdAt ? shipment.createdAt.toDate() : new Date(),
        // ✅ Datas reais de cada etapa (vindas do Firestore)
        collectedAt: shipment.collectedAt?.toDate?.() || null,
        inTransitAt: shipment.inTransitAt?.toDate?.() || null,
        arrivedAt: shipment.arrivedAt?.toDate?.() || null,
        outForDeliveryAt: shipment.outForDeliveryAt?.toDate?.() || null,
        deliveredAt: shipment.deliveredAt?.toDate?.() || null,
        trackingUpdates,
        // Progresso (opcional, pode ser calculado com base no status)
        progress: shipment.progress || 0,
      };

      logger.info(`Rastreamento encontrado para o código: ${code}`);
      res.json({
        success: true,
        data: responseData
      });
    } catch (error: any) {
      logger.error('Erro ao buscar rastreamento:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar informações de rastreamento' });
    }
  }
};