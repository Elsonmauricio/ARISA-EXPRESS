import {
  addBusinessDays,
  getBusinessDaysBetween,
  isBusinessDay,
  calculateWeeksOverdue,
  calculateFine,
  calculateLocationFine,
  formatDate,
} from '../utils/businessDays';

describe('businessDays.ts', () => {
  describe('isBusinessDay', () => {
    it('returns false for Saturday', () => {
      expect(isBusinessDay(new Date('2026-01-03'))).toBe(false); // Saturday
    });
    it('returns false for Sunday', () => {
      expect(isBusinessDay(new Date('2026-01-04'))).toBe(false); // Sunday
    });
    it('returns false for holidays', () => {
      expect(isBusinessDay(new Date('2026-01-01'))).toBe(false); // New Year
      expect(isBusinessDay(new Date('2026-04-25'))).toBe(false); // Liberty Day
      expect(isBusinessDay(new Date('2026-05-01'))).toBe(false); // Labour Day
      expect(isBusinessDay(new Date('2026-06-10'))).toBe(false); // Portugal Day
      expect(isBusinessDay(new Date('2026-08-15'))).toBe(false); // Assumption
      expect(isBusinessDay(new Date('2026-10-05'))).toBe(false); // Republic Day
      expect(isBusinessDay(new Date('2026-11-01'))).toBe(false); // All Saints
      expect(isBusinessDay(new Date('2026-12-01'))).toBe(false); // Restoration of Independence
      expect(isBusinessDay(new Date('2026-12-08'))).toBe(false); // Immaculate Conception
      expect(isBusinessDay(new Date('2026-12-25'))).toBe(false); // Christmas
    });
    it('returns true for a normal weekday', () => {
      expect(isBusinessDay(new Date('2026-01-05'))).toBe(true); // Monday
    });
  });

  describe('addBusinessDays', () => {
    it('skips weekends when adding days', () => {
      const start = new Date('2026-01-02'); // Friday
      const result = addBusinessDays(start, 5);
      // Friday + 5 business days = next Friday (Jan 9)
      expect(result.getDay()).not.toBe(0);
      expect(result.getDay()).not.toBe(6);
    });

    it('returns the same date when days=0', () => {
      const start = new Date('2026-01-05');
      const result = addBusinessDays(start, 0);
      expect(result.getTime()).toBe(start.getTime());
    });

    it('skips holidays', () => {
      // Jan 1 2026 is a holiday; starting from Dec 30 2025 (Tue)
      const start = new Date('2025-12-30');
      const result = addBusinessDays(start, 1);
      // Dec 31 (Wed) is the first business day
      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(11); // 0-indexed
    });
  });

  describe('getBusinessDaysBetween', () => {
    it('counts only business days', () => {
      const start = new Date('2026-01-05'); // Monday
      const end = new Date('2026-01-09'); // Friday
      const count = getBusinessDaysBetween(start, end);
      expect(count).toBe(4); // Tue, Wed, Thu, Fri
    });

    it('returns 0 when start >= end', () => {
      const start = new Date('2026-01-09');
      const end = new Date('2026-01-05');
      expect(getBusinessDaysBetween(start, end)).toBe(0);
    });
  });

  describe('calculateWeeksOverdue', () => {
    it('returns 0 when not overdue', () => {
      const deadline = new Date('2026-01-10');
      const now = new Date('2026-01-05');
      expect(calculateWeeksOverdue(deadline, now)).toBe(0);
    });

    it('returns 1 for 7 days overdue', () => {
      const deadline = new Date('2026-01-01');
      const now = new Date('2026-01-08');
      expect(calculateWeeksOverdue(deadline, now)).toBe(1);
    });

    it('ceilings partial weeks', () => {
      const deadline = new Date('2026-01-01');
      const now = new Date('2026-01-09'); // 8 days
      expect(calculateWeeksOverdue(deadline, now)).toBe(2);
    });
  });

  describe('calculateFine', () => {
    it('applies €5 per week overdue', () => {
      const deadline = new Date('2026-01-01');
      const now = new Date('2026-01-15'); // 2 weeks
      expect(calculateFine(deadline, now)).toBe(10);
    });

    it('returns 0 when not overdue', () => {
      const deadline = new Date('2026-01-10');
      const now = new Date('2026-01-05');
      expect(calculateFine(deadline, now)).toBe(0);
    });
  });

  describe('calculateLocationFine', () => {
    it('applies 10% for Luanda destination', () => {
      expect(calculateLocationFine(100, 'Luanda')).toBe(10);
      expect(calculateLocationFine(100, 'Angola')).toBe(10);
    });

    it('returns 0 for Lisbon', () => {
      expect(calculateLocationFine(100, 'Lisboa')).toBe(0);
      expect(calculateLocationFine(100, 'Portugal')).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('formats a date in pt-PT locale', () => {
      const date = new Date('2026-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('2026');
    });
  });
});