// backend/src/utils/phoneValidator.ts

export type DefaultCountry = 'PT' | 'AO';

/**
 * Normalizes and validates a phone number to canonical E.164 format.
 *
 * Supported formats:
 *  - Canonical international: +351xxxxxxxxx, +244xxxxxxxxx
 *  - International with 00 prefix: 00351xxxxxxxxx, 00244xxxxxxxxx
 *  - 9-digit local numbers: prefixed with the country code from
 *    `defaultCountry` (PT by default, AO when defaultCountry='AO')
 *  - Portugal national format with trunk 0: 0 + 9 digits
 *
 * Whitespace, hyphens, parentheses and dots are stripped. Numbers that are
 * ambiguous, unsafe, or not from Portugal/Angola are rejected.
 *
 * @returns canonical E.164 string (e.g. "+351900000000") or null.
 */
export function validateE164Phone(
  phone: string,
  defaultCountry?: DefaultCountry
): string | null {
  if (!phone || typeof phone !== 'string') return null;

  let clean = phone.trim();
  if (!clean) return null;

  // Strip spaces, hyphens, parentheses and dots
  clean = clean.replace(/[\s\-().]/g, '');
  if (!clean) return null;

  // Support "00" international prefix -> "+"
  if (clean.startsWith('00')) {
    clean = '+' + clean.slice(2);
  }

  if (clean.startsWith('+')) {
    const digits = clean.slice(1).replace(/\D/g, '');
    if (!digits) return null;
    clean = '+' + digits;
  } else {
    const digits = clean.replace(/\D/g, '');
    if (!digits) return null;

    if (digits.length === 9) {
      // 9-digit local number — apply default country (PT by default)
      const cc = defaultCountry === 'AO' ? '244' : '351';
      clean = '+' + cc + digits;
    } else if (digits.length === 10 && digits.startsWith('0') && defaultCountry !== 'AO') {
      // Portugal national format with trunk prefix 0
      clean = '+351' + digits.slice(1);
    } else if (digits.startsWith('351') && digits.length === 12) {
      clean = '+351' + digits.slice(3);
    } else if (digits.startsWith('244') && digits.length === 12) {
      clean = '+244' + digits.slice(3);
    } else {
      return null;
    }
  }

  // Canonical E.164 structural check
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(clean)) return null;

  // Country-specific validation — only Portugal (+351) and Angola (+244)
  if (clean.startsWith('+351')) {
    const local = clean.slice(4);
    if (local.length !== 9) return null;
    if (!/^[2-9]/.test(local)) return null;
  } else if (clean.startsWith('+244')) {
    const local = clean.slice(4);
    if (local.length !== 9) return null;
    if (!/^[2-9]/.test(local)) return null;
  } else {
    // Reject unsafe / ambiguous numbers from unsupported countries
    return null;
  }

  return clean;
}