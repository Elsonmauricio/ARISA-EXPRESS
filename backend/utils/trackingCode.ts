// backend/src/utils/trackingCode.ts
import crypto from 'crypto';

export function generateTrackingCode(): string {
  const year = new Date().getFullYear();
  const block = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `AE-${year}-${block}`;
}

export function validateTrackingCode(code: string): boolean {
  return /^AE-\d{4}-[A-F0-9]{4}$/.test(code);
}