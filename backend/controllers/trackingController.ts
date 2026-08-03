// backend/src/controllers/trackingController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { calculateFine, calculateWeeksOverdue, formatDate } from '../utils/businessDays';
import { fixEncodingObject } from '../utils/encoding';

function toIsoDate(ts: any): string | null {
  if (!ts) return null;
  try {
    if (ts.toDate) return ts.toDate().toISOString();
    if (ts.toMillis) return new Date(ts.toMillis()).toISOString();
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === 'string') return new Date(ts).toISOString();
    if (typeof ts === 'number') return new Date(ts).toISOString();
    return null;
  } catch {
    return null;
  }
}

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

      const trackingUpdates = trackingSnapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      status: data.status,
      location: data.location,
      description: data.description,
      timestamp: toIsoDate(data.timestamp)
    };
  });

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
        collectedAt: toIsoDate(shipment.collectedAt),
        inTransitAt: toIsoDate(shipment.inTransitAt),
        arrivedAt: toIsoDate(shipment.arrivedAt),
        outForDeliveryAt: toIsoDate(shipment.outForDeliveryAt),
        deliveredAt: toIsoDate(shipment.deliveredAt),
        pickedUpAt: toIsoDate(shipment.pickedUpAt),
        readyForPickupAt: toIsoDate(shipment.readyForPickupAt),
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
