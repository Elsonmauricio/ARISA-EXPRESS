// backend/src/utils/phoneValidator.ts
export function validateE164Phone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;

  let clean = phone.trim();

  if (clean.startsWith('00')) {
    clean = '+' + clean.slice(2);
  }

  if (!clean.startsWith('+')) {
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 9) {
      clean = '+351' + digits;
    } else if (digits.length === 11 && digits.startsWith('244')) {
      clean = '+' + digits;
    } else if (digits.length >= 10 && digits.length <= 13) {
      clean = '+' + digits;
    } else {
      return null;
    }
  }

  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(clean)) return null;

  return clean;
}
