// backend/src/services/whatsappService.ts
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import { generatePickupMessage, getPickupImage, generateWhatsAppLink } from '../utils/whatsapp';
import { formatDate } from '../utils/businessDays';

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

let client: any = null;
let isInitializing = false;

function isWhatsAppEnabled(): boolean {
  return process.env.WPPCONNECT_ENABLED === 'true';
}

function isFeatureEnabled(): boolean {
  return process.env.WHATSAPP_ENABLED === 'true' || process.env.WPPCONNECT_ENABLED === 'true';
}

function getSessionName(): string {
  return process.env.WPPCONNECT_SESSION_NAME || process.env.WA_SESSION_NAME || 'arisa_express';
}

async function getClient(): Promise<any | null> {
  if (client) return client;
  if (isInitializing) {
    let wait = 0;
    while (isInitializing && wait < 30000) {
      await new Promise(r => setTimeout(r, 100));
      wait += 100;
    }
    return client;
  }
  if (!isWhatsAppEnabled()) {
    logger.info('WhatsApp automation disabled - using link fallback');
    return null;
  }

  isInitializing = true;
  try {
    const wa: any = require('@open-wa/wa-automate');
    const createTimeout = parseInt(process.env.WA_CREATE_TIMEOUT || '30000', 10);
    client = await Promise.race([
      wa.create({
        sessionId: getSessionName(),
        sessionDataPath: process.env.WA_SESSION_DATA_PATH || path.join(require('os').tmpdir(), 'arisa_express_wa'),
        headless: process.env.WPPCONNECT_HEADLESS !== 'false',
        disableSpins: true,
        logFile: process.env.WA_LOG_FILE,
        logColor: false,
        debug: false,
        useChrome: true,
        browserRevision: process.env.CHROME_REVISION || undefined,
        killProcessOnClose: false,
        executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
        puppeteer: {
          headless: process.env.WPPCONNECT_HEADLESS !== 'false',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        }
      }),
      new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('WhatsApp create() timed out')), createTimeout)
      )
    ]);
    logger.info('WhatsApp client initialized successfully');
    return client;
  } catch (err: any) {
    logger.error('Failed to initialize WhatsApp client:', err.message);
    client = null;
    return null;
  } finally {
    isInitializing = false;
  }
}

async function ensureClient(): Promise<any> {
  if (!client) {
    await getClient();
  }
  return client;
}

export class WhatsAppService {
  static async sendPickupNotification(data: WhatsAppNotificationData): Promise<{ success: boolean; messageId?: string; link?: string; error?: string; sent?: boolean }> {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      return { success: false, sent: false, error: 'Numero de telefone invalido' };
    }

    let phoneNumber: string;
    if (cleanPhone.length === 9) {
      phoneNumber = data.location === 'luanda' ? '244' + cleanPhone : '351' + cleanPhone;
    } else {
      phoneNumber = cleanPhone;
    }
    const chatId = phoneNumber + '@s.whatsapp.net';

    await ensureClient();

    const message = generatePickupMessage({
      ...data,
      phone: data.phone
    });

    if (client) {
      try {
        const imagePath = getPickupImage(data.location);
        if (imagePath) {
          const absolutePath = path.resolve(__dirname, '../../' + imagePath);
          const resolvedPath = fs.existsSync(absolutePath) ? absolutePath : imagePath;
          try {
            const result = await client.sendImage(chatId, resolvedPath, undefined, message);
            logger.info('WhatsApp image sent to ' + data.phone + ' for ' + data.trackingCode);
            return { success: true, sent: true, messageId: result?.id || result?.t };
          } catch (imgErr: any) {
            logger.warn('Image send failed, trying text:', imgErr.message);
            const result = await client.sendText(chatId, message);
            logger.info('WhatsApp text sent to ' + data.phone + ' for ' + data.trackingCode);
            return { success: true, sent: true, messageId: result?.id || result?.t };
          }
        }
        const result = await client.sendText(chatId, message);
        logger.info('WhatsApp text sent to ' + data.phone + ' for ' + data.trackingCode);
        return { success: true, sent: true, messageId: result?.id || result?.t };
      } catch (err: any) {
        logger.error('Failed to send WhatsApp to ' + data.phone + ':', err.message);
        logger.error('Full error:', err.stack || err.message);
        const link = generateWhatsAppLink(data.phone, message, data.location);
        logger.info('Falling back to link: ' + link);
        return { success: true, sent: false, link, error: err.message };
      }
    }

    const link = generateWhatsAppLink(data.phone, message, data.location);
    logger.info('WhatsApp automation not available, generated link: ' + link);
    return { success: true, sent: false, link };
  }

  static isConfigured(): boolean {
    return isFeatureEnabled();
  }

  static async initialize(): Promise<void> {
    if (isWhatsAppEnabled()) {
      try {
        await getClient();
        logger.info('WhatsApp service initialized');
      } catch (err: any) {
        logger.warn('Failed to initialize WhatsApp service:', err.message);
      }
    } else {
      logger.info('WhatsApp service in manual mode (link generation)');
    }
  }
}
