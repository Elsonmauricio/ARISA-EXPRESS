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
  static async sendPickupNotification(data: WhatsAppNotificationData): Promise<{ success: boolean; messageId?: string; link?: string | null; error?: string; sent: boolean }> {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      return { success: false, sent: false, error: 'Numero de telefone invalido' };
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      const link = generateWhatsAppLink(data.phone, generatePickupMessage(data), data.location);
      logger.info('WhatsApp link generated (no API token configured)');
      return { success: true, sent: false, link };
    }

    try {
      const countryCode = data.location === 'luanda' ? '244' : '351';
      const recipient = cleanPhone.length === 9 ? `${countryCode}${cleanPhone}` : cleanPhone;
      const messageBody = generatePickupMessage(data);

      const payload: Record<string, any> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          body: messageBody,
          preview_url: false
        }
      };

      const apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';
      const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        const errorMsg = result.error?.message || `HTTP ${response.status}`;
        logger.error(`WhatsApp API error: ${errorMsg}`);
        return { success: false, sent: false, error: errorMsg };
      }

      const messageId = result.messages?.[0]?.id;
      logger.info(`WhatsApp text sent: wamid=${messageId} to=${recipient} location=${data.location}`);

      return { success: true, sent: true, messageId };
    } catch (error: any) {
      logger.error('WhatsApp send error:', error.message);
      return { success: false, sent: false, error: error.message };
    }
  }

  static isConfigured(): boolean {
    return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }

  static async initialize(): Promise<void> {
    if (this.isConfigured()) {
      logger.info('WhatsApp service configured (text message mode)');
    } else {
      logger.info('WhatsApp service in manual mode (link generation)');
    }
  }
}
