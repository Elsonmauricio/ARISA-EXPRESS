// backend/src/controllers/notifyController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { addBusinessDays, formatDate } from '../utils/businessDays';
import { generateWhatsAppMessage, generateWhatsAppLink, guessLocationType } from '../utils/whatsapp';

export const NotifyController = {
  sendPickupNotification: async (req: Request, res: Response) => {
    try {
      const { orderCode, customerPhone, destination } = req.body;

      if (!orderCode || !customerPhone) {
        return res.status(400).json({ error: 'orderCode e customerPhone são obrigatórios' });
      }

      const snapshot = await db.collection('shipments')
        .where('trackingCode', '==', orderCode)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const docRef = snapshot.docs[0].ref;
      const shipment = snapshot.docs[0].data() as any;

      const cleanPhone = (customerPhone || shipment.receiverPhone || shipment.senderPhone || '').replace(/\D/g, '');
      if (cleanPhone.length < 9) {
        return res.status(400).json({ error: 'Telefone inválido' });
      }

      const dest = destination || shipment.destination || '';
      const locationType = guessLocationType(dest);
      const readyDate = shipment.readyForPickupAt
        ? new Date(shipment.readyForPickupAt.toDate ? shipment.readyForPickupAt.toDate() : shipment.readyForPickupAt)
        : new Date();
      const deadline = shipment.pickupDeadline
        ? new Date(shipment.pickupDeadline.toDate ? shipment.pickupDeadline.toDate() : shipment.pickupDeadline)
        : addBusinessDays(readyDate, 5);

      const message = generateWhatsAppMessage({
        trackingCode: shipment.trackingCode,
        shipmentDate: formatDate(readyDate),
        deadline: formatDate(deadline),
        senderName: shipment.senderName || 'N/A',
        receiverName: shipment.receiverName || 'N/A',
        phone: cleanPhone,
        pickupAddress: shipment.pickupAddress || '',
        pickupContact: shipment.pickupContact || '',
        pickupSchedule: shipment.pickupSchedule || '',
        price: shipment.price,
        destination: dest
      });

      const link = generateWhatsAppLink(cleanPhone, message, locationType);

      logger.info(`Notify WhatsApp: order=${orderCode} (link mode)`);
      res.json({
        success: true,
        messageId: null,
        sent: false,
        link,
        message,
        error: link ? null : 'Falha ao gerar link'
      });
    } catch (error: any) {
      logger.error('Erro ao enviar notificação WhatsApp:', error.message);
      res.status(500).json({ error: 'Erro ao enviar notificação' });
    }
  }
};
