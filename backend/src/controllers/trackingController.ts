// backend/src/controllers/trackingController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const TrackingController = {
  getTrackingInfo: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      
      const snapshot = await db.collection('shipments')
        .where('trackingCode', '==', code)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipmentDoc = snapshot.docs[0];
      const shipment = { id: shipmentDoc.id, ...shipmentDoc.data() } as any;

      const trackingSnapshot = await db.collection('shipments').doc(shipmentDoc.id)
        .collection('trackingUpdates')
        .orderBy('timestamp', 'desc')
        .get();

      const trackingUpdates = trackingSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const progressMap: Record<string, number> = {
        'PENDING': 10, 'COLLECTED': 25, 'IN_TRANSIT': 40,
        'CUSTOMS': 55, 'IN_PORTUGAL': 70, 'OUT_FOR_DELIVERY': 85, 'DELIVERED': 100
      };
      
      const progress = progressMap[shipment.status] || 0;
      
      res.json({
        success: true,
        data: { ...shipment, trackingUpdates, progress }
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar informações' });
    }
  }
};