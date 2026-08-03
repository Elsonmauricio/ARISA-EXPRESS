// backend/src/services/whatsappService.ts
import { logger } from '../utils/logger';
import { generateWhatsAppLink, generatePickupMessage } from '../utils/whatsapp';

type LocationType = 'lisbon' | 'luanda';

interface WhatsAppNotificationData {
  phone: string;
  trackingCode: string;
  shipmentDate: string;
  deadline: string;
  senderName: string;
  receiverName: string;
  pickupAddress: string;
  pickupContact: string;
  pickupSchedule: string;
  location: LocationType;
  destination: string;
}

export class WhatsAppService {
  static async sendPickupNotification(data: WhatsAppNotificationData): Promise<{ success: boolean; messageId?: string; link?: string; error?: string; sent: boolean }> {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      return { success: false, sent: false, error: 'Numero de telefone invalido' };
    }

    const message = generatePickupMessage({
      ...data,
      phone: data.phone
    });

    const link = generateWhatsAppLink(data.phone, message, data.location);
    logger.info('WhatsApp link generated for ' + data.phone + ' (' + data.trackingCode + ')');
    return { success: true, sent: false, link };
  }

  static isConfigured(): boolean {
    return process.env.WHATSAPP_ENABLED !== 'false';
  }

  static async initialize(): Promise<void> {
    logger.info('WhatsApp service in manual mode (link generation)');
  }
}
