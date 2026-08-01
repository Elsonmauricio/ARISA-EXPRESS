// backend/src/controllers/trackingController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { calculateFine, calculateWeeksOverdue, formatDate } from '../utils/businessDays';
import { fixEncodingObject } from '../utils/encoding';

export const TrackingController = {
  getTracking: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const normalizedCode = String(code || '').trim();

      const snapshot = await db.collection('shipments')
        .where('trackingCode', '==', normalizedCode)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipmentDoc = snapshot.docs[0];
      const shipment = shipmentDoc.data();

      const trackingSnapshot = await db.collection('shipments')
        .doc(shipmentDoc.id)
        .collection('trackingUpdates')
        .orderBy('timestamp', 'desc')
        .get();

      const trackingUpdates = trackingSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      let fineInfo: any = null;
      if (shipment.pickupDeadline && shipment.status === 'READY_FOR_PICKUP') {
        const deadline = new Date(shipment.pickupDeadline.toDate ? shipment.pickupDeadline.toDate() : shipment.pickupDeadline);
        const now = new Date();
        const fine = calculateFine(deadline, now);
        const weeksOverdue = calculateWeeksOverdue(deadline, now);

        if (fine > 0) {
          fineInfo = {
            hasFine: true,
            deadline: formatDate(deadline),
            weeksOverdue,
            fine,
            currency: 'EUR'
          };
        } else {
          fineInfo = {
            hasFine: false,
            deadline: formatDate(deadline),
            weeksOverdue: 0,
            fine: 0,
            currency: 'EUR'
          };
        }
      }

      const responseData = {
        trackingCode: shipment.trackingCode || code,
        origin: shipment.origin || 'N/A',
        destination: shipment.destination || 'N/A',
        route: shipment.route || '',
        weight: shipment.weight || 0,
        price: shipment.price || 0,
        freightValue: shipment.freightValue || 0,
        category: shipment.category || '',
        paymentStatus: shipment.paymentStatus || 'PENDING',
        senderName: shipment.senderName || 'N/A',
        senderContact: shipment.senderContact || '',
        receiverName: shipment.receiverName || 'N/A',
        receiverContact: shipment.receiverContact || '',
        status: shipment.status || 'PENDING',
        createdAt: shipment.createdAt ? shipment.createdAt.toDate() : new Date(),
        shipmentDate: shipment.shipmentDate ? shipment.shipmentDate.toDate() : null,

        // ✅ Datas reais de cada etapa (vindas do Firestore)
        collectedAt: shipment.collectedAt?.toMillis?.() || shipment.collectedAt?.toDate?.()?.getTime?.() || null,
        inTransitAt: shipment.inTransitAt?.toMillis?.() || shipment.inTransitAt?.toDate?.()?.getTime?.() || null,
        arrivedAt: shipment.arrivedAt?.toMillis?.() || shipment.arrivedAt?.toDate?.()?.getTime?.() || null,
        outForDeliveryAt: shipment.outForDeliveryAt?.toMillis?.() || shipment.outForDeliveryAt?.toDate?.()?.getTime?.() || null,
        deliveredAt: shipment.deliveredAt?.toMillis?.() || shipment.deliveredAt?.toDate?.()?.getTime?.() || null,
        trackingUpdates,
        cttCode: shipment.cttCode || '',
        cttLink: shipment.cttLink || '',
        fine: fineInfo,

        progress: shipment.progress || 0,
      };

logger.info(`Rastreamento encontrado para o código: ${code}`);
      res.json({
        success: true,
        data: fixEncodingObject(responseData)
      });
    } catch (error: any) {
      logger.error('Erro ao buscar rastreamento:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar informações de rastreamento' });
    }
  }
};
