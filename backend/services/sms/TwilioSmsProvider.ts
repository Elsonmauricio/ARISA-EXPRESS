// backend/services/sms/TwilioSmsProvider.ts
import { BaseSmsProvider } from './BaseSmsProvider';
import { ISmsPayload, ISmsResult } from '../../interfaces/ISmsProvider';

export class TwilioSmsProvider extends BaseSmsProvider {
  readonly name = 'twilio';

  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;

  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)');
    }
  }

  async send(payload: ISmsPayload): Promise<ISmsResult> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    const form = new URLSearchParams();
    form.set('To', payload.to);
    form.set('From', this.fromNumber);
    form.set('Body', payload.message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    const result = await response.json() as any;

    if (!response.ok || result.error_code) {
      return {
        success: false,
        sent: false,
        error: result.error_message || `HTTP ${response.status}`,
        provider: this.name
      };
    }

    return {
      success: true,
      sent: true,
      messageId: result.sid,
      provider: this.name
    };
  }
}
