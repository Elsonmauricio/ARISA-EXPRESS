// backend/services/sms/GenericHttpSmsProvider.ts
import { BaseSmsProvider } from './BaseSmsProvider';
import { ISmsPayload, ISmsResult } from '../../interfaces/ISmsProvider';

export class GenericHttpSmsProvider extends BaseSmsProvider {
  readonly name = 'generic-http';

  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor() {
    super();
    this.endpoint = process.env.SMS_GATEWAY_URL || '';
    this.apiKey = process.env.SMS_GATEWAY_API_KEY || '';
    this.senderId = process.env.SMS_GATEWAY_SENDER_ID || 'ArisaExpress';

    if (!this.endpoint || !this.apiKey) {
      throw new Error('SMS Gateway credentials not configured (SMS_GATEWAY_URL, SMS_GATEWAY_API_KEY)');
    }
  }

  async send(payload: ISmsPayload): Promise<ISmsResult> {
    const body = {
      to: payload.to,
      message: payload.message,
      sender: this.senderId,
      apiKey: this.apiKey
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json() as any;

    if (!response.ok || result.status === 'failed') {
      return {
        success: false,
        sent: false,
        error: result.error || result.message || `HTTP ${response.status}`,
        provider: this.name
      };
    }

    return {
      success: true,
      sent: true,
      messageId: result.messageId || result.id,
      provider: this.name
    };
  }
}
