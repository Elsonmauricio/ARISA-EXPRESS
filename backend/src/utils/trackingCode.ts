// backend/src/utils/trackingCode.ts
export function generateTrackingCode(): string {
  const prefix = 'ARISA';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function validateTrackingCode(code: string): boolean {
  const regex = /^ARISA-[A-Z0-9]+-[A-Z0-9]{4}$/;
  return regex.test(code);
}