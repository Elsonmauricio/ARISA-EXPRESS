// backend/services/sms/BaseSmsProvider.ts
import { ISmsProvider, ISmsPayload, ISmsResult } from '../../interfaces/ISmsProvider';

export abstract class BaseSmsProvider implements ISmsProvider {
  abstract readonly name: string;
  abstract send(payload: ISmsPayload): Promise<ISmsResult>;

  async sendWithRetry(
    payload: ISmsPayload,
    maxAttempts: number = 5,
    baseDelayMs: number = 1000
  ): Promise<ISmsResult> {
    let lastError: string = 'Unknown error';
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const result = await this.send(payload);
        if (result.success) {
          return { ...result, provider: this.name };
        }
        lastError = result.error || 'Unknown provider error';
      } catch (error: any) {
        lastError = error.message || 'Network/parsing error';
      }

      if (attempt < maxAttempts) {
        const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), 30000);
        const jitter = Math.floor(Math.random() * 500);
        await new Promise(resolve => setTimeout(resolve, exponentialDelay + jitter));
      }
    }

    return {
      success: false,
      sent: false,
      error: `Failed after ${attempt} attempts. Last error: ${lastError}`,
      provider: this.name
    };
  }
}
