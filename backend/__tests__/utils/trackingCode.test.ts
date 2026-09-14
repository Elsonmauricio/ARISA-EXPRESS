import { generateTrackingCode, validateTrackingCode } from '../utils/trackingCode';

describe('trackingCode.ts', () => {
  describe('generateTrackingCode', () => {
    it('returns a code matching the pattern AE-YYYY-XXXX', () => {
      const code = generateTrackingCode();
      expect(code).toMatch(/^AE-\d{4}-[A-F0-9]{4}$/);
    });

    it('includes the current year', () => {
      const code = generateTrackingCode();
      const year = new Date().getFullYear();
      expect(code).toContain(`AE-${year}-`);
    });

    it('generates unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateTrackingCode());
      }
      expect(codes.size).toBe(100);
    });
  });

  describe('validateTrackingCode', () => {
    it('accepts valid codes', () => {
      expect(validateTrackingCode('AE-2026-1A2B')).toBe(true);
      expect(validateTrackingCode('AE-2025-FFFF')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(validateTrackingCode('')).toBe(false);
      expect(validateTrackingCode('AE-26-1A2B')).toBe(false);
      expect(validateTrackingCode('XX-2026-1A2B')).toBe(false);
      expect(validateTrackingCode('AE-2026-1A2')).toBe(false);
      expect(validateTrackingCode('AE-2026-1A2B5')).toBe(false);
    });
  });
});