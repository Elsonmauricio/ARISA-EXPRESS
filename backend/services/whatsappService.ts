// backend/src/services/whatsappService.ts
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { generateWhatsAppLink, generatePickupMessage, getPickupImage, getLocationType } from '../utils/whatsapp';

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

interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'image' | 'text';
  parameters?: Array<{
    type: 'text' | 'image';
    text?: string;
    image?: { link: string };
  }>;
}

function getTemplateName(destination: string): string {
  const loc = getLocationType(destination || '');
  return loc === 'luanda'
    ? (process.env.WHATSAPP_TEMPLATE_LUANDA || 'encomenda_pronta_luanda')
    : (process.env.WHATSAPP_TEMPLATE_LISBOA || 'encomenda_pronta_lisboa');
}

function getImageUrl(destination: string): string {
  const loc = getLocationType(destination || '');
  const envKey = loc === 'luanda' ? 'WHATSAPP_IMAGE_URL_LUANDA' : 'WHATSAPP_IMAGE_URL_LISBOA';
  const fallback = getPickupImage(loc);

  const configured = process.env[envKey];
  if (configured && !configured.includes('localhost')) {
    return configured;
  }

  const backendUrl = process.env.BACKEND_URL || '';
  if (backendUrl && !backendUrl.includes('localhost')) {
    return `${backendUrl}/api/assets/images/${loc === 'luanda' ? 'Luanda' : 'Lisboa'}.jpeg`;
  }

  return fallback;
}

function buildTemplateComponents(
  data: WhatsAppNotificationData,
  destination: string
): TemplateComponent[] {
  const components: TemplateComponent[] = [];
  const imageUrl = getImageUrl(destination);

  components.push({
    type: 'header',
    sub_type: 'image',
    parameters: [{ type: 'image', image: { link: imageUrl } }]
  });

  components.push({
    type: 'body',
    sub_type: 'text',
    parameters: [
      { type: 'text', text: data.trackingCode },
      { type: 'text', text: data.shipmentDate },
      { type: 'text', text: data.deadline },
      { type: 'text', text: data.senderName },
      { type: 'text', text: data.receiverName },
      { type: 'text', text: data.pickupAddress },
      { type: 'text', text: data.pickupContact },
      { type: 'text', text: data.pickupSchedule }
    ]
  });

  return components;
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
      const templateName = getTemplateName(data.destination);
      const components = buildTemplateComponents(data, data.destination);
      const countryCode = data.location === 'luanda' ? '244' : '351';
      const recipient = cleanPhone.length === 9 ? `${countryCode}${cleanPhone}` : cleanPhone;

      const payload: Record<string, any> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_PT' },
          components
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
      logger.info(`WhatsApp template sent: template=${templateName} wamid=${messageId} to=${recipient}`);

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
      const templates = [
        process.env.WHATSAPP_TEMPLATE_LISBOA || 'encomenda_pronta_lisboa',
        process.env.WHATSAPP_TEMPLATE_LUANDA || 'encomenda_pronta_luanda'
      ];
      logger.info(`WhatsApp service configured with templates: ${templates.join(', ')}`);
    } else {
      logger.info('WhatsApp service in manual mode (link generation)');
    }
  }
}
