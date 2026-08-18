// backend/services/sms/SmsNotificationService.ts
import { EventEmitter } from 'events';
import { ISmsProvider, ISmsResult } from '../../interfaces/ISmsProvider';
import { TwilioSmsProvider } from './TwilioSmsProvider';
import { GenericHttpSmsProvider } from './GenericHttpSmsProvider';
import { MockSmsProvider } from './MockSmsProvider';
import { SmsJobPayload } from './types';
import { logger } from '../../utils/logger';
import { validateE164Phone } from '../../utils/phoneValidator';

export type SmsProviderType = 'twilio' | 'generic-http' | 'mock';

export class SmsNotificationService extends EventEmitter {
  private provider: ISmsProvider;
  private queue: SmsJobPayload[] = [];
  private isProcessing = false;
  private readonly concurrency: number;

  constructor(providerType: SmsProviderType = 'mock', concurrency: number = 3) {
    super();
    this.concurrency = concurrency;
    this.provider = this.createProvider(providerType);
    this.startProcessing();
  }

  private createProvider(type: SmsProviderType): ISmsProvider {
    switch (type) {
      case 'twilio':
        return new TwilioSmsProvider();
      case 'generic-http':
        return new GenericHttpSmsProvider();
      case 'mock':
      default:
        return new MockSmsProvider();
    }
  }

  enqueuePickupNotification(data: {
    shipmentId: string;
    trackingCode: string;
    phone: string;
    data: {
      readyDate: string;
      deadline: string;
      senderName: string;
      receiverName: string;
      pickupAddress: string;
      pickupContact: string;
      pickupSchedule: string;
      destination: string;
    };
  }): boolean {
    const cleanPhone = validateE164Phone(data.phone);
    if (!cleanPhone) {
      logger.warn(`SMS enqueue skipped: invalid phone for shipment ${data.trackingCode}`);
      return false;
    }

    const job: SmsJobPayload = {
      shipmentId: data.shipmentId,
      trackingCode: data.trackingCode,
      phone: cleanPhone,
      data: { ...data.data, trackingCode: data.trackingCode, phone: cleanPhone },
      attempts: 0,
      maxAttempts: 5,
      nextRetryAt: Date.now()
    };

    this.queue.push(job);
    this.emit('job:enqueued', job);
    logger.info(`SMS job enqueued for shipment ${data.trackingCode} (queue size: ${this.queue.length})`);
    return true;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const now = Date.now();
        const readyJobs = this.queue.filter(job => job.nextRetryAt <= now);
        const batch = readyJobs.slice(0, this.concurrency);

        if (batch.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        const results = await Promise.allSettled(
          batch.map(job => this.processJob(job))
        );

        for (let i = 0; i < results.length; i++) {
          const jobIndex = this.queue.indexOf(batch[i]);
          if (jobIndex > -1) {
            this.queue.splice(jobIndex, 1);
          }
        }

        this.emit('batch:processed', { processed: results.length });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: SmsJobPayload): Promise<void> {
    job.attempts++;

    const message = this.buildPickupSmsMessage({
      trackingCode: job.trackingCode,
      readyDate: job.data.readyDate,
      deadline: job.data.deadline,
      senderName: job.data.senderName,
      receiverName: job.data.receiverName,
      pickupAddress: job.data.pickupAddress,
      pickupContact: job.data.pickupContact,
      pickupSchedule: job.data.pickupSchedule,
      destination: job.data.destination,
      phone: job.phone
    });

    try {
      const result: ISmsResult = await this.provider.send({
        to: job.phone,
        message
      });

      this.emit('job:completed', { job, result });

      if (result.sent) {
        logger.info(`SMS sent successfully to ${job.phone} for shipment ${job.trackingCode} (attempt ${job.attempts})`);
      } else {
        logger.warn(`SMS failed for shipment ${job.trackingCode} (attempt ${job.attempts}): ${result.error}`);
        this.requeueJob(job);
      }
    } catch (error: any) {
      logger.error(`SMS processing error for shipment ${job.trackingCode}: ${error.message}`);
      this.emit('job:failed', { job, error: error.message });
      this.requeueJob(job);
    }
  }

  private requeueJob(job: SmsJobPayload): void {
    if (job.attempts >= job.maxAttempts) {
      logger.error(`SMS job abandoned for shipment ${job.trackingCode} after ${job.attempts} attempts`);
      return;
    }

    const exponentialDelay = Math.min(1000 * Math.pow(2, job.attempts - 1), 30000);
    const jitter = Math.floor(Math.random() * 1000);
    job.nextRetryAt = Date.now() + exponentialDelay + jitter;

    this.queue.push(job);
    this.emit('job:requeued', { job, delayMs: exponentialDelay + jitter });
    logger.info(`SMS job requeued for shipment ${job.trackingCode} (attempt ${job.attempts}, next in ${exponentialDelay + jitter}ms)`);
  }

  private buildPickupSmsMessage(data: {
    trackingCode: string;
    readyDate: string;
    deadline: string;
    senderName: string;
    receiverName: string;
    pickupAddress: string;
    pickupContact: string;
    pickupSchedule: string;
    destination: string;
    phone: string;
  }): string {
    const location = data.destination?.toLowerCase().includes('luanda') || data.destination?.toLowerCase().includes('angola')
      ? 'Luanda'
      : 'Lisboa';

    const address = data.pickupAddress || (location === 'Luanda'
      ? 'Morro Bento, Av. 21 de Janeiro, defronte Hotel Ágatha, Arisa Express'
      : 'CC Flamingos, Loja 47, Av. Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros');

    const contact = data.pickupContact || (location === 'Luanda' ? '+244 948 440 920' : '+351 934 292 082');
    const schedule = data.pickupSchedule || (location === 'Luanda'
      ? 'Seg a Sex: 08:00-12:00 | 13:00-17:00'
      : 'Seg a Sex: 09:00-13:00 | 14:00-18:00');

    return `Arisa Express: Sua encomenda ${data.trackingCode} esta pronta para levantamento em ${location}.\n\nLocal: ${address}\nContacto: ${contact}\nHorario: ${schedule}\n\nPrazo limite: ${data.deadline} (5 dias uteis).\nRemetente: ${data.senderName}\nDestinatario: ${data.receiverName}`;
  }

  private startProcessing(): void {
    const interval = setInterval(() => {
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }, 5000);

    this.processQueue();
    this.on('job:enqueued', () => {
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}
