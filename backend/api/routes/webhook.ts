// backend/src/api/routes/webhook.ts
import { Router, Request, Response } from 'express';
import { db } from '../../config/firebase';
import { logger } from '../../utils/logger';

const router = Router();

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'arisa_express_verify_2024';

const CANONICAL_STATUS_VALUES = ['sent', 'delivered', 'read', 'played', 'failed'] as const;
const CANONICAL_STATUSES = new Set(CANONICAL_STATUS_VALUES);
type CanonicalStatus = typeof CANONICAL_STATUS_VALUES[number];

interface WebhookError {
  code: number | string;
  title: string;
  message?: string;
  href?: string;
}

interface RawWebhookStatus {
  id: string;
  status: string;
  recipient_id: string;
  errors?: WebhookError[];
  timestamp: string;
}

interface WebhookEntry {
  changes: Array<{
    value: {
      statuses?: RawWebhookStatus[];
    };
  }>;
}

const ERROR_CODES: Record<string, { title: string; action: string }> = {
  '131047': { title: 'Re-engagement message required', action: 'Use template Utility.' },
  '131026': { title: 'Número inválido ou sem WhatsApp', action: 'Verificar formato E.164.' },
  '132000': { title: 'Quantidade de variáveis incorreta', action: 'Confirmar parâmetros do template.' },
  '132001': { title: 'Template inexistente ou não aprovado', action: 'Verificar nome e idioma.' },
  '131056': { title: 'Rate limit', action: 'Implementar fila de envio.' },
  '131042': { title: 'Problema de pagamento ou elegibilidade', action: 'Verificar faturação e WABA.' },
  '131031': { title: 'Conta empresarial bloqueada', action: 'Contactar suporte Meta.' },
  '190': { title: 'Token inválido ou expirado', action: 'Gerar novo token.' },
};

function getErrorInfo(code: number | string) {
  const key = String(code);
  return ERROR_CODES[key] || {
    title: `Erro ${key} (não mapeado)`,
    action: 'Consultar documentação Meta.'
  };
}

function normalizeStatus(raw: string): CanonicalStatus | null {
  const lower = raw.toLowerCase();
  return CANONICAL_STATUSES.has(lower as CanonicalStatus) ? (lower as CanonicalStatus) : null;
}

function validateTimestamp(ts: string): number | null {
  const n = Number(ts);
  return Number.isFinite(n) && n > 0 ? n : null;
}

router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  if (!mode || !token || !challenge) {
    return res.status(400).json({ error: 'Parâmetros em falta.' });
  }

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    logger.info('[Webhook] Verificação OK');
    return res.status(200).send(challenge);
  }

  logger.warn('[Webhook] Verificação falhou — token incorreto.');
  return res.status(403).json({ error: 'Token de verificação incorreto.' });
});

async function updateShipmentStatus(rawStatus: RawWebhookStatus): Promise<void> {
  const canonical = normalizeStatus(rawStatus.status);
  if (!canonical) {
    logger.warn(`[Webhook] wamid=${rawStatus.id} status desconhecido="${rawStatus.status}" — ignorado`);
    return;
  }

  const ts = validateTimestamp(rawStatus.timestamp);
  const updatedAt = ts ? new Date(ts * 1000).toISOString() : new Date().toISOString();

  const updateData: Record<string, any> = {
    whatsapp_status: canonical,
    whatsapp_updated_at: updatedAt,
  };

  if (canonical === 'failed' && rawStatus.errors?.length) {
    const err = rawStatus.errors[0];
    const info = getErrorInfo(err.code);
    updateData.whatsapp_error_code = err.code;
    updateData.whatsapp_error_title = info.title;
    updateData.whatsapp_error_action = info.action;
    updateData.whatsapp_error_details = JSON.stringify(rawStatus.errors);
    logger.error(`[Webhook:FAILED] wamid=${rawStatus.id} code=${err.code} title="${info.title}" action="${info.action}" details=${updateData.whatsapp_error_details}`);
  }

  logger.info(`[Webhook] wamid=${rawStatus.id} status=${canonical} recipient=${rawStatus.recipient_id} ts=${ts ?? 'invalid'}`);

  const snapshot = await db.collection('shipments')
    .where('whatsapp_message_id', '==', rawStatus.id)
    .limit(1)
    .get();

  if (snapshot.empty) {
    logger.warn(`[Webhook] wamid=${rawStatus.id} não encontrado em shipments`);
    return;
  }

  const docRef = snapshot.docs[0].ref;
  await docRef.update(updateData);
  logger.info(`[Webhook] Shipment ${docRef.id} atualizado → whatsapp_status=${canonical}`);
}

function isValidEntry(entry: unknown): entry is WebhookEntry {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  if (!Array.isArray(e.changes)) return false;
  return e.changes.every(c => c && typeof c === 'object' && 'value' in c);
}

function isValidChange(change: unknown): change is { value: { statuses?: RawWebhookStatus[] } } {
  if (!change || typeof change !== 'object') return false;
  const c = change as Record<string, unknown>;
  if (!c.value || typeof c.value !== 'object') return false;
  const v = c.value as Record<string, unknown>;
  if (v.statuses !== undefined && !Array.isArray(v.statuses)) return false;
  return true;
}

function isValidStatus(status: unknown): status is RawWebhookStatus {
  if (!status || typeof status !== 'object') return false;
  const s = status as Record<string, unknown>;
  return typeof s.id === 'string' &&
    typeof s.status === 'string' &&
    typeof s.recipient_id === 'string' &&
    typeof s.timestamp === 'string';
}

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body as { object?: string; entry?: unknown[] };

    if (payload.object !== 'whatsapp_business_account') {
      return res.status(200).json({ status: 'ignored' });
    }

    const entries = payload.entry ?? [];
    let processed = 0;
    let skipped = 0;

    for (const entry of entries) {
      if (!isValidEntry(entry)) {
        logger.warn('[Webhook] Entrada malformada ignorada', { entry });
        skipped++;
        continue;
      }

      for (const change of entry.changes) {
        if (!isValidChange(change)) {
          logger.warn('[Webhook] Change malformado ignorado', { change });
          skipped++;
          continue;
        }

        const statuses = change.value.statuses ?? [];
        for (const status of statuses) {
          if (!isValidStatus(status)) {
            logger.warn('[Webhook] Status malformado ignorado', { status });
            skipped++;
            continue;
          }
          await updateShipmentStatus(status);
          processed++;
        }
      }
    }

    logger.info(`[Webhook] Processados=${processed} Ignorados=${skipped}`);
    return res.status(200).json({ status: 'received', processed, skipped });
  } catch (err) {
    logger.error('[Webhook] Erro ao processar eventos:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
