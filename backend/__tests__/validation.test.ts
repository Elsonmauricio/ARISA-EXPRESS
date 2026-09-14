import {
  loginSchema,
  createShipmentSchema,
  adminCreateShipmentSchema,
  updateCttSchema,
  batchStatusUpdateSchema,
  registerSchema,
} from '../types/validation';

describe('validation.ts — Zod Schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      const result = loginSchema.parse({
        body: { email: 'user@example.com', password: 'any' },
      });
      expect(result.body.email).toBe('user@example.com');
    });

    it('rejects invalid email', () => {
      expect(() =>
        loginSchema.parse({ body: { email: 'not-an-email', password: 'x' } })
      ).toThrow();
    });

    it('rejects missing password', () => {
      expect(() =>
        loginSchema.parse({ body: { email: 'user@example.com' } })
      ).toThrow();
    });
  });

  describe('createShipmentSchema', () => {
    const validPayload = {
      body: {
        origin: 'Lisboa',
        destination: 'Luanda',
        senderName: 'João Silva',
        senderPhone: '+351900000000',
        receiverName: 'Maria Santos',
        receiverPhone: '+244900000000',
        weight: 5,
        serviceType: 'REDIRECT',
      },
    };

    it('accepts a valid shipment payload', () => {
      expect(() => createShipmentSchema.parse(validPayload)).not.toThrow();
    });

    it('rejects weight <= 0', () => {
      expect(() =>
        createShipmentSchema.parse({ ...validPayload, body: { ...validPayload.body, weight: 0 } })
      ).toThrow();
    });

    it('rejects invalid serviceType', () => {
      expect(() =>
        createShipmentSchema.parse({ ...validPayload, body: { ...validPayload.body, serviceType: 'INVALID' } })
      ).toThrow();
    });

    it('rejects missing origin', () => {
      expect(() =>
        createShipmentSchema.parse({
          ...validPayload,
          body: { ...validPayload.body, origin: 'L' },
        })
      ).toThrow();
    });
  });

  describe('adminCreateShipmentSchema', () => {
    const validPayload = {
      body: {
        origin: 'Lisboa',
        destination: 'Luanda',
        senderName: 'Operador',
        receiverName: 'Cliente',
        weight: 10,
      },
    };

    it('accepts minimal valid payload', () => {
      expect(() => adminCreateShipmentSchema.parse(validPayload)).not.toThrow();
    });

    it('rejects negative freightValue', () => {
      expect(() =>
        adminCreateShipmentSchema.parse({
          ...validPayload,
          body: { ...validPayload.body, freightValue: -5 },
        })
      ).toThrow();
    });

    it('rejects invalid paymentStatus', () => {
      expect(() =>
        adminCreateShipmentSchema.parse({
          ...validPayload,
          body: { ...validPayload.body, paymentStatus: 'UNKNOWN' },
        })
      ).toThrow();
    });

    it('accepts valid cttLink URL', () => {
      expect(() =>
        adminCreateShipmentSchema.parse({
          ...validPayload,
          body: { ...validPayload.body, cttLink: 'https://www.ctt.pt/track/123' },
        })
      ).not.toThrow();
    });

    it('accepts empty cttLink', () => {
      expect(() =>
        adminCreateShipmentSchema.parse({
          ...validPayload,
          body: { ...validPayload.body, cttLink: '' },
        })
      ).not.toThrow();
    });
  });

  describe('updateCttSchema', () => {
    it('accepts valid CTT code and link', () => {
      expect(() =>
        updateCttSchema.parse({
          body: { cttCode: 'EE123456789PT', cttLink: 'https://ctt.pt/track' },
        })
      ).not.toThrow();
    });

    it('rejects invalid URL in cttLink', () => {
      expect(() =>
        updateCttSchema.parse({ body: { cttLink: 'not-a-url' } })
      ).toThrow();
    });
  });

  describe('batchStatusUpdateSchema', () => {
    it('accepts valid batch update', () => {
      expect(() =>
        batchStatusUpdateSchema.parse({
          body: { route: 'Lisboa » Luanda', status: 'IN_TRANSIT' },
        })
      ).not.toThrow();
    });

    it('rejects invalid status enum', () => {
      expect(() =>
        batchStatusUpdateSchema.parse({
          body: { route: 'Lisboa » Luanda', status: 'INVALID_STATUS' },
        })
      ).toThrow();
    });
  });

  describe('registerSchema', () => {
    it('accepts valid registration', () => {
      expect(() =>
        registerSchema.parse({
          body: { email: 'new@example.com', password: '123456', name: 'Ana' },
        })
      ).not.toThrow();
    });

    it('rejects password shorter than 6 characters', () => {
      expect(() =>
        registerSchema.parse({
          body: { email: 'new@example.com', password: '123', name: 'Ana' },
        })
      ).toThrow();
    });
  });
});