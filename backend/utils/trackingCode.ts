// backend/src/utils/trackingCode.ts
import crypto from 'crypto';

export function generateTrackingCode(): string {
  // Primeiro bloco: 4 caracteres aleatórios (hex)
  const block1 = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 hex chars
  // Segundo bloco: 4 caracteres aleatórios (hex)
  const block2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ARISA-${block1}-${block2}`;
}

export function validateTrackingCode(code: string): boolean {
  return /^ARISA-[A-F0-9]{4}-[A-F0-9]{4}$/.test(code);
}