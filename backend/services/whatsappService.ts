// backend/services/whatsappService.ts
import { logger } from '../utils/logger';
import {
  generateWhatsAppLink,
  generatePickupMessage,
  LocationType
} from '../utils/whatsapp';
import { validateE164Phone } from '../utils/phoneValidator';

/**
 * Tipos públicos do payload "template" da Meta WhatsApp Cloud API.
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/message-templates
 */
export type TemplateComponentType = 'header' | 'body' | 'button';

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
  date_time?: { fallback_value: string };
  image?: { link: string };
  document?: { link: string; filename?: string };
  video?: { link: string };
}

export interface TemplateComponent {
  type: TemplateComponentType;
  /**
   * Obrigatório para "button" (sub_type + index), opcional para "header" (parameters)
   * e "body" (parameters).
   */
  sub_type?: 'quick_reply' | 'url' | 'copy_code';
  index?: number;
  parameters?: TemplateParameter[];
}

export interface SendTemplateMessageInput {
  /** Destinatário em E.164 (ex: "+351934292082") ou formato local — será normalizado. */
  to: string;
  /** Nome exato do template aprovado no Meta Business Manager. */
  templateName: string;
  /** Código de idioma do template (ex: "pt_PT", "pt_BR", "en_US"). */
  languageCode: string;
  /** Componentes do template (header/body/buttons) com as variáveis. */
  components?: TemplateComponent[];
}

export interface SendTemplateMessageResult {
  success: boolean;
  sent: boolean;
  messageId?: string;
  error?: string;
  /** Link wa.me gerado como fallback manual. */
  link?: string | null;
  /** Indica se o envio foi apenas simulado (modo dev/MOCK). */
  simulated?: boolean;
  raw?: unknown;
}

interface MetaMessagesResponse {
  messages?: { id: string }[];
  error?: { message: string; type?: string; code?: number; fbtrace_id?: string };
}

/**
 * Mantém compatibilidade com o payload "WhatsAppNotificationData" já usado
 * pelo resto do backend (controladores antigos, link generation, etc.).
 */
export interface WhatsAppNotificationData {
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

const GRAPH_API_BASE = 'https://graph.facebook.com';

/**
 * Determina se o serviço está em modo real (credenciais Meta presentes)
 * ou em modo dev/MOCK (apenas logging e fallback para link wa.me).
 */
function isLiveMode(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Normaliza um número para E.164. Devolve null se não for possível.
 * Faz heurística Portugal (351) e Angola (244) consoante a localização opcional.
 */
function normalizePhone(rawPhone: string, location?: LocationType): string | null {
  const e164 = validateE164Phone(rawPhone);
  if (e164) return e164;

  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('351') || digits.startsWith('244')) {
    return '+' + digits;
  }

  if (digits.length === 9) {
    const cc = location === 'luanda' ? '244' : '351';
    return `+${cc}${digits}`;
  }

  return null;
}

export class WhatsAppService {
  /**
   * Envia uma mensagem via template oficial da Meta WhatsApp Cloud API.
   * POST https://graph.facebook.com/{version}/{PHONE_NUMBER_ID}/messages
   *
   * Em modo dev (sem WHATSAPP_TOKEN) faz apenas log + devolve link wa.me,
   * sem lançar erros — permite que o backend continue a funcionar em testes.
   */
  static async sendTemplateMessage(
    input: SendTemplateMessageInput
  ): Promise<SendTemplateMessageResult> {
    const recipient = normalizePhone(input.to);
    if (!recipient) {
      const err = `Número inválido para envio WhatsApp: "${input.to}"`;
      logger.warn(`[WhatsApp] ${err}`);
      return { success: false, sent: false, error: err };
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';

    // Modo dev/MOCK — não falhar em ambiente de testes.
    if (!token || !phoneNumberId) {
      logger.info(
        `[WhatsApp][MOCK] Template "${input.templateName}" (${input.languageCode}) → ${recipient} ` +
          `(defina WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID para envio real)`
      );
      return {
        success: true,
        sent: false,
        simulated: true,
        link: `https://wa.me/${recipient.replace('+', '')}`
      };
    }

    const url = `${GRAPH_API_BASE}/${apiVersion}/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient.replace('+', ''),
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.languageCode },
        components: input.components ?? []
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json().catch(() => ({}))) as MetaMessagesResponse;

      if (!response.ok || result.error) {
        const apiMessage = result.error?.message || `HTTP ${response.status}`;
        logger.error(
          `[WhatsApp] Meta API error (template=${input.templateName} to=${recipient}): ${apiMessage}`,
          { code: result.error?.code, type: result.error?.type, fbtrace_id: result.error?.fbtrace_id }
        );
        return { success: false, sent: false, error: apiMessage, raw: result };
      }

      const messageId = result.messages?.[0]?.id;
      logger.info(
        `[WhatsApp] Template "${input.templateName}" enviado: wamid=${messageId} to=${recipient}`
      );

      return { success: true, sent: true, messageId, raw: result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[WhatsApp] Falha de rede ao enviar template: ${message}`);
      return { success: false, sent: false, error: message };
    }
  }

  /**
   * Helper de alto nível: dispara o template oficial "shipment_ready_for_pickup"
   * (ou o nome configurado em WHATSAPP_READY_TEMPLATE) com as variáveis da
   * encomenda. Mantém a interface usada pelos controllers.
   */
  static async sendPickupTemplate(data: WhatsAppNotificationData): Promise<SendTemplateMessageResult> {
    const location = data.location || 'lisbon';

    const templateName =
      process.env.WHATSAPP_READY_TEMPLATE ||
      (location === 'luanda'
        ? process.env.WHATSAPP_READY_TEMPLATE_LUANDA || 'encomenda_disponivel_luanda'
        : process.env.WHATSAPP_READY_TEMPLATE_LISBOA || 'encomenda_disponivel_lisboa');

    const languageCode =
      process.env.WHATSAPP_READY_TEMPLATE_LANG ||
      (location === 'luanda'
        ? process.env.WHATSAPP_READY_TEMPLATE_LANG_LUANDA || 'pt_PT'
        : process.env.WHATSAPP_READY_TEMPLATE_LANG_LISBOA || 'pt_PT');

    const recipient = normalizePhone(data.phone, data.location);
    if (!recipient) {
      return { success: false, sent: false, error: 'Número de telefone inválido' };
    }

    // Componente BODY com as variáveis na ordem definida no template.
    // Sugestão de ordem no Meta: {{1}} Nome destinatário, {{2}} Tracking,
    // {{3}} Data envio, {{4}} Prazo, {{5}} Morada levantamento, {{6}} Contacto.
    const bodyParams: TemplateParameter[] = [
      { type: 'text', text: data.receiverName || 'Cliente' },
      { type: 'text', text: data.trackingCode },
      { type: 'text', text: data.shipmentDate },
      { type: 'text', text: data.deadline },
      { type: 'text', text: data.senderName || '' },
      { type: 'text', text: data.receiverName || 'Cliente' },
      { type: 'text', text: data.pickupAddress || '' },
      { type: 'text', text: data.pickupContact || '' }
    ];

    return this.sendTemplateMessage({
      to: recipient,
      templateName,
      languageCode,
      components: [{ type: 'body', parameters: bodyParams }]
    });
  }

  /**
   * Mantido por retrocompatibilidade: gera link wa.me em modo MOCK, ou
   * envia texto livre (apenas útil se o cliente abriu janela de 24h).
   * Para envio 100% automático prefere `sendTemplateMessage`.
   */
  static async sendPickupNotification(
    data: WhatsAppNotificationData
  ): Promise<{ success: boolean; messageId?: string; link?: string | null; error?: string; sent: boolean }> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      const link = generateWhatsAppLink(data.phone, generatePickupMessage(data), data.location);
      logger.info('[WhatsApp] link generated (no API token configured)');
      return { success: true, sent: false, link };
    }

    // Em modo automático, usa SEMPRE template (não cai em texto livre).
    const result = await this.sendPickupTemplate(data);
    return {
      success: result.success,
      sent: result.sent,
      messageId: result.messageId,
      error: result.error,
      link: result.link ?? null
    };
  }

  static isConfigured(): boolean {
    return isLiveMode();
  }

  static async initialize(): Promise<void> {
    if (isLiveMode()) {
      logger.info('[WhatsApp] Service configured (Cloud API live mode)');
    } else {
      logger.info('[WhatsApp] Service in MOCK mode (link generation + logs)');
    }
  }
}
