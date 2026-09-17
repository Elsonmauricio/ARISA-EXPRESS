import { validateE164Phone } from '../../utils/phoneValidator';

describe('phoneValidator.ts', () => {
  describe('Portugal (+351)', () => {
    it('accepts canonical +351', () => {
      expect(validateE164Phone('+351900000000')).toBe('+351900000000');
    });

    it('accepts 00351 prefix', () => {
      expect(validateE164Phone('00351900000000')).toBe('+351900000000');
    });

    it('accepts 9-digit local with default PT', () => {
      expect(validateE164Phone('900000000')).toBe('+351900000000');
    });

    it('accepts 9-digit local with explicit defaultCountry PT', () => {
      expect(validateE164Phone('900000000', 'PT')).toBe('+351900000000');
    });

    it('accepts PT national format with trunk 0', () => {
      expect(validateE164Phone('0900000000')).toBe('+351900000000');
    });

    it('strips spaces, hyphens, parentheses and dots', () => {
      expect(validateE164Phone('+351 900-000.000')).toBe('+351900000000');
      expect(validateE164Phone('(91)2345678')).toBe('+351912345678');
    });

    it('rejects leading 0 in local number', () => {
      expect(validateE164Phone('090000000')).toBeNull();
    });

    it('rejects wrong-length PT number', () => {
      expect(validateE164Phone('+35190000000')).toBeNull();
    });
  });

  describe('Angola (+244)', () => {
    it('accepts canonical +244', () => {
      expect(validateE164Phone('+244900000000')).toBe('+244900000000');
    });

    it('accepts 00244 prefix', () => {
      expect(validateE164Phone('00244900000000')).toBe('+244900000000');
    });

    it('accepts 9-digit local with defaultCountry AO', () => {
      expect(validateE164Phone('900000000', 'AO')).toBe('+244900000000');
    });

    it('accepts 9-digit local when default is PT', () => {
      expect(validateE164Phone('900000000', 'PT')).toBe('+351900000000');
    });

    it('rejects wrong-length AO number', () => {
      expect(validateE164Phone('+24490000000')).toBeNull();
    });
  });

  describe('rejections', () => {
    it('rejects empty / non-string', () => {
      expect(validateE164Phone('')).toBeNull();
      expect(validateE164Phone(null as unknown as string)).toBeNull();
      expect(validateE164Phone(undefined as unknown as string)).toBeNull();
    });

    it('rejects unsupported country codes', () => {
      expect(validateE164Phone('+12123456789')).toBeNull();
      expect(validateE164Phone('+447000000000')).toBeNull();
    });

    it('defaults ambiguous 9-digit to PT', () => {
      expect(validateE164Phone('900000000')).toBe('+351900000000');
    });

    it('rejects leading-zero local AO', () => {
      expect(validateE164Phone('090000000', 'AO')).toBeNull();
    });
  });
});