// backend/services/sms/MockSmsProvider.ts
import { ISmsProvider, ISmsPayload, ISmsResult } from '../../interfaces/ISmsProvider';

export class MockSmsProvider implements ISmsProvider {
  readonly name = 'mock';

  async send(payload: ISmsPayload): Promise<ISmsResult> {
    return {
      success: true,
      sent: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      provider: this.name
    };
  }
}
