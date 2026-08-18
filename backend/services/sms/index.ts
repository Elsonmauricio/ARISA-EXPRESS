// backend/services/sms/index.ts
import { SmsNotificationService, SmsProviderType } from './SmsNotificationService';

let instance: SmsNotificationService | null = null;

export function getSmsNotificationService(provider: SmsProviderType = 'mock'): SmsNotificationService {
  if (!instance) {
    const envProvider = (process.env.SMS_PROVIDER || 'mock') as SmsProviderType;
    instance = new SmsNotificationService(envProvider);
  }
  return instance;
}
