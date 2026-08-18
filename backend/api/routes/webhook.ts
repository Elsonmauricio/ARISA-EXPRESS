// backend/src/api/routes/webhook.ts
import { Router, Request, Response } from 'express';
import { db } from '../../config/firebase';
import { logger } from '../../utils/logger';

const router = Router();

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'arisa_express_verify_2024';

interface WebhookError {
  code: number;
  title: string;
  message?: string;
  href?: string;
}

interface WebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  recipient_id: string;
  errors?: WebhookError[];
  timestamp: string;
}

interface WebhookEntry {
  changes: Array<{
    value: {
      statuses?: WebhookStatus[];
    };
  }>;
}

const ERROR_CODES: Record<number, { title: string; action: string }> = {
  131047: { title: 'Re-engagement message required', action: 'Use template Utility.' },
  131026: { title: 'Número inválido ou sem WhatsApp', action: 'Verificar formato E.164.' },
  132000: { title: 'Quantidade de variáveis incorreta', action: 'Confirmar parâmetros do template.' },
  132001: { title: 'Template inexistente ou não aprovado', action: 'Verificar nome e idioma.' },
  131056: { title: 'Rate limit', action: 'Implementar fila de envio.' },
  131042: { title: 'Problema de pagamento ou elegibilidade', action: 'Verificar faturação e WABA.' },
  131031: { title: 'Conta empresarial bloqueada', action: 'Contactar suporte Meta.' },
  190: { title: 'Token inválido ou expirado', action: 'Gerar novo token.' },
};

function getErrorInfo(code: number) {
  return ERROR_CODES[code] || {
    title: `Erro ${code} (não mapeado)`,
    action: 'Consultar documentação Meta.'
  };
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

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body as { object?: string; entry?: WebhookEntry[] };

    if (payload.object !== 'whatsapp_business_account') {
      return res.status(200).json({ status: 'ignored' });
    }

    res.status(200).json({ status: 'received' });

    setImmediate(async () => {
      try {
        for (const entry of payload.entry || []) {
          for (const change of entry.changes || []) {
            const value = change.value;

            if (value.statuses && value.statuses.length > 0) {
              for (const status of value.statuses) {
                logger.info(`[Webhook] wamid=${status.id} status=${status.status} recipient=${status.recipient_id}`);

                const updateData: Record<string, any> = {
                  whatsapp_status: status.status,
                  whatsapp_updated_at: new Date(parseInt(status.timestamp) * 1000).toISOString()
                };

                if (status.status === 'failed' && status.errors?.length) {
                  const err = status.errors[0];
                  const info = getErrorInfo(err.code);
                  updateData.whatsapp_error_code = err.code;
                  updateData.whatsapp_error_title = err.title;
                  updateData.whatsapp_error_action = info.action;
                  updateData.whatsapp_error_details = JSON.stringify(status.errors);
                  logger.error(`[Webhook:FAILED] wamid=${status.id} code=${err.code} title="${err.title}"`);
                }

                const snapshot = await db.collection('shipments')
                  .where('whatsapp_message_id', '==', status.id)
                  .limit(1)
                  .get();

                if (!snapshot.empty) {
                  const docRef = snapshot.docs[0].ref;
                  await docRef.update(updateData);
                  logger.info(`[Webhook] Shipment ${docRef.id} atualizado → whatsapp_status=${status.status}`);
                } else {
                  logger.warn(`[Webhook] wamid=${status.id} não encontrado em shipments`);
                }
              }
            }
          }
        }
      } catch (err) {
        logger.error('[Webhook] Erro ao processar eventos:', err);
      }
    });
  } catch (err) {
    logger.error('[Webhook] Erro no handler:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
