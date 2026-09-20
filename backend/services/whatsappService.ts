// backend/services/whatsappService.ts
import { logger } from '../utils/logger';
import {
  generateWhatsAppLink,
  generatePickupMessage,
  LocationType
} from '../utils/whatsapp';
import { validateE164Phone, type DefaultCountry } from '../utils/phoneValidator';

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
  /** Destinatário em E.164 (ex: "+351934292082"); números locais ambíguos exigem contexto de país. */
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
  messageStatus?: 'accepted' | 'held_for_quality_assessment' | 'paused';
  recipientWaId?: string;
  deliveryStatus?: 'accepted' | 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
  errorDetails?: MetaErrorDetails;
  /** Link wa.me gerado como fallback manual. */
  link?: string | null;
  /** Indica se o envio foi apenas simulado (modo dev/MOCK). */
  simulated?: boolean;
  raw?: unknown;
}

interface MetaErrorResponse {
  message?: string;
  type?: string;
  code?: number | string;
  fbtrace_id?: string;
}

export interface MetaErrorDetails {
  code?: number | string;
  type?: string;
  fbtrace_id?: string;
  httpStatus?: number;
}

interface MetaMessagesResponse {
  messages?: { id?: string; message_status?: 'accepted' | 'held_for_quality_assessment' | 'paused' }[];
  contacts?: { input?: string; wa_id?: string }[];
  error?: MetaErrorResponse;
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
const DEFAULT_GRAPH_API_VERSION = 'v26.0';
const GRAPH_API_VERSION_PATTERN = /^v\d+(?:\.\d+)?$/;
const MAX_ATTEMPTS = 3;
const RETRYABLE_META_CODES = new Set([4, 80007, 130429, 131000, 131016, 131045, 131056, 133004, 133009]);

function getGraphApiVersion(): string {
  const configuredVersion = normalizeApiVersion(process.env.META_GRAPH_API_VERSION);
  if (configuredVersion) return configuredVersion;

  if (process.env.META_GRAPH_API_VERSION?.trim()) {
    logger.warn(`[WhatsApp] META_GRAPH_API_VERSION inválida; usando ${DEFAULT_GRAPH_API_VERSION}`);
  }

  return DEFAULT_GRAPH_API_VERSION;
}

/**
 * Determina se o serviço está em modo real (credenciais Meta presentes)
 * ou em modo dev/MOCK (apenas logging e fallback para link wa.me).
 */
function isLiveMode(): boolean {
  return Boolean(
    process.env.WHATSAPP_TOKEN?.trim() &&
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

function sanitizeTemplateText(raw: string): string {
  return (raw || '')
    .replace(/\\r\\n/g, ' | ')
    .replace(/\\n/g, ' | ')
    .replace(/\\r/g, ' | ')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, ' | ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\|\s*/g, ' | ')
    .trim();
}

function sanitizeTemplateParameter(parameter: TemplateParameter): TemplateParameter {
  if (parameter.type !== 'text' || !parameter.text) {
    return parameter;
  }

  let text = sanitizeTemplateText(parameter.text);
  const digits = text.replace(/\D/g, '');
  if (/^(?:\+|00)/.test(text) && digits.length >= 9) {
    text = '+' + digits.replace(/^0+/, '');
  }

  return { ...parameter, text };
}

function normalizeApiVersion(value: string | undefined): string | null {
  const version = value?.trim().replace(/^\/+|\/+$/g, '');
  return version && GRAPH_API_VERSION_PATTERN.test(version) ? version : null;
}

function normalizePhone(rawPhone: string, defaultCountry?: DefaultCountry): string | null {
  const digits = (rawPhone || '').replace(/\D/g, '');
  const ambiguousLocalNumber = digits.length === 9 || (digits.length === 10 && digits.startsWith('0'));
  if (!defaultCountry && ambiguousLocalNumber) return null;
  return validateE164Phone(rawPhone, defaultCountry);
}

function getDefaultTemplateConfig(location: LocationType): { templateName: string; languageCode: string } {
  if (location === 'luanda') {
    return {
      templateName: process.env.WHATSAPP_READY_TEMPLATE_LUANDA?.trim() || 'shipment_ready_for_pickup_ao',
      languageCode: process.env.WHATSAPP_READY_TEMPLATE_LANG_LUANDA?.trim() || 'pt_PT'
    };
  }
  return {
    templateName: process.env.WHATSAPP_READY_TEMPLATE_LISBOA?.trim() || 'shipment_ready_for_pickup_pt',
    languageCode: process.env.WHATSAPP_READY_TEMPLATE_LANG_LISBOA?.trim() || 'pt_PT'
  };
}

function extractErrorDetails(error: unknown): MetaErrorDetails {
  const details: MetaErrorDetails = {};
  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.code === 'number' || typeof candidate.code === 'string') details.code = candidate.code;
    if (typeof candidate.type === 'string') details.type = candidate.type;
    if (typeof candidate.fbtrace_id === 'string') details.fbtrace_id = candidate.fbtrace_id;
  }
  return details;
}

function buildMetaErrorDetails(error: MetaErrorResponse | undefined, httpStatus: number): MetaErrorDetails {
  const details: MetaErrorDetails = { httpStatus };
  if (typeof error?.code === 'number' || typeof error?.code === 'string') details.code = error.code;
  if (typeof error?.type === 'string') details.type = error.type;
  if (typeof error?.fbtrace_id === 'string') details.fbtrace_id = error.fbtrace_id;
  return details;
}

function buildFailure(error: string, details?: MetaErrorDetails, raw?: unknown): SendTemplateMessageResult {
  const result: SendTemplateMessageResult = { success: false, sent: false, error };
  if (details && Object.keys(details).length > 0) result.errorDetails = details;
  if (raw !== undefined) result.raw = raw;
  return result;
}

function isRetryableMetaCode(code?: number | string): boolean {
  const numericCode = typeof code === 'number' ? code : Number(code);
  return Number.isInteger(numericCode) && RETRYABLE_META_CODES.has(numericCode);
}

function delay(attempt: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, attempt * 1000));
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

    const token = process.env.WHATSAPP_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    const templateName = input.templateName?.trim();
    const languageCode = input.languageCode?.trim();
    const missingTemplate = [
      !templateName ? 'nome' : '',
      !languageCode ? 'idioma' : ''
    ].filter((value): value is string => Boolean(value));

    if (!token || !phoneNumberId) {
      const missing = [
        !token ? 'WHATSAPP_TOKEN' : '',
        !phoneNumberId ? 'WHATSAPP_PHONE_NUMBER_ID' : '',
        ...missingTemplate.map(value => `template ${value}`)
      ].filter((value): value is string => Boolean(value));
      logger.info(
        `[WhatsApp][MOCK] Template "${templateName}" (${languageCode}) → ${recipient} ` +
          `(${missing.join(', ')} ausente)`
      );
      return {
        success: true,
        sent: false,
        simulated: true,
        error: 'WhatsApp não configurado — link wa.me disponível'
      };
    }

    const apiVersion = getGraphApiVersion();

    if (missingTemplate.length > 0) {
      const message = 'Nome e idioma do template são obrigatórios';
      logger.error(`[WhatsApp] ${message}`);
      return buildFailure(message);
    }

    const url = `${GRAPH_API_BASE}/${apiVersion}/${phoneNumberId}/messages`;
    const components = (input.components ?? []).map(component => ({
      ...component,
      ...(component.parameters
        ? { parameters: component.parameters.map(sanitizeTemplateParameter) }
        : {})
    }));
    const payload = {
      messaging_product: 'whatsapp' as const,
      recipient_type: 'individual' as const,
      to: recipient.replace('+', ''),
      type: 'template' as const,
      template: {
        name: templateName,
        language: { code: languageCode },
        components
      }
    };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const rawBody = await response.text();
        let parsed: unknown = null;
        try {
          parsed = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          parsed = rawBody;
        }
        const result = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
          ? parsed as MetaMessagesResponse
          : null;
        const metaError = result?.error;
        const retryable =
          response.status === 429 ||
          response.status >= 500 ||
          isRetryableMetaCode(metaError?.code);

        if (!result || !response.ok || metaError) {
          const details = buildMetaErrorDetails(metaError, response.status);
          const apiMessage = !result
            ? `Resposta Meta inválida (HTTP ${response.status})`
            : metaError?.message?.trim() || `Meta API HTTP ${response.status}`;
          logger.error(
            `[WhatsApp] Meta API error (template=${templateName} to=${recipient}, httpStatus=${response.status}): ${apiMessage}`,
            {
              code: details.code,
              type: details.type,
              fbtrace_id: details.fbtrace_id,
              httpStatus: details.httpStatus,
              error: metaError
                ? {
                    code: metaError.code,
                    message: metaError.message,
                    type: metaError.type,
                    fbtrace_id: metaError.fbtrace_id
                  }
                : undefined,
              rawBody,
              rawResponse: parsed
            }
          );

          if (!retryable || attempt === MAX_ATTEMPTS) {
            return buildFailure(apiMessage, details, result ?? undefined);
          }

          logger.warn(`[WhatsApp] Tentativa ${attempt} falhou para ${recipient}; nova tentativa em ${attempt * 1000}ms`);
        } else {
          const messageData = result?.messages?.[0];
          const contact = result?.contacts?.[0];
          const messageId = messageData?.id;
          const messageStatus = messageData?.message_status;
          logger.info(
            `[WhatsApp] Template "${templateName}" aceite pela Meta: wamid=${messageId} to=${recipient} messageStatus=${messageStatus || 'unknown'}`
          );
          return {
            success: true,
            sent: true,
            messageId,
            messageStatus,
            recipientWaId: contact?.wa_id,
            deliveryStatus: messageStatus === 'accepted' ? 'accepted' : undefined,
            raw: result
          };
        }
      } catch (error: unknown) {
        const details = extractErrorDetails(error);
        const message = error instanceof Error && error.message ? error.message : String(error);
        logger.error(
          `[WhatsApp] Falha de rede ao enviar template para ${recipient}: ${message}`,
          {
            code: details.code,
            type: details.type,
            fbtrace_id: details.fbtrace_id
          }
        );
        return buildFailure(message, details);
      }

      await delay(attempt);
    }

    return buildFailure('Falha ao enviar template WhatsApp');
  }

  /**
   * Helper de alto nível: dispara o template oficial "shipment_ready_for_pickup"
   * (ou o nome configurado em WHATSAPP_READY_TEMPLATE) com as variáveis da
   * encomenda. Mantém a interface usada pelos controllers.
   */
  static async sendPickupTemplate(data: WhatsAppNotificationData): Promise<SendTemplateMessageResult> {
    const location = data.location === 'luanda' ? 'luanda' : 'lisbon';
    const defaultCountry: DefaultCountry = location === 'luanda' ? 'AO' : 'PT';

    const defaults = getDefaultTemplateConfig(location);
    const templateName = defaults.templateName;
    const languageCode = defaults.languageCode;

    if (!templateName || !languageCode) {
      const err = 'Nome e idioma do template são obrigatórios (configuração em falta)';
      logger.error(`[WhatsApp] ${err}`);
      return { success: false, sent: false, error: err };
    }

    const recipient = validateE164Phone(data.phone, defaultCountry);
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
  ): Promise<SendTemplateMessageResult> {
    const token = process.env.WHATSAPP_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

    if (!token || !phoneNumberId) {
      const link = generateWhatsAppLink(data.phone, generatePickupMessage(data), data.location);
      logger.info('[WhatsApp] link generated (no API token configured)');
      return {
        success: true,
        sent: false,
        simulated: true,
        link,
        error: 'Credenciais WhatsApp Cloud API não configuradas; mensagem não enviada'
      };
    }

    return this.sendPickupTemplate(data);
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
