import request from 'supertest';
import { createTestApp, authHeader } from './helpers/testApp';

describe('Auth — Integration Tests', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 with token for valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', password: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    it('returns 200 with token for valid client credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'client@teste.com', password: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('CLIENT');
    });

    it('returns 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@teste.com', password: 'bad' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns a new token', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
    });
  });
});

describe('Authorization Middleware', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  it('allows ADMIN to access /api/admin/stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', authHeader('ADMIN'));

    expect(res.status).toBe(200);
  });

  it('denies CLIENT access to /api/admin/stats with 403', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', authHeader('CLIENT'));

    expect(res.status).toBe(403);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired/invalid token', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer invalid-token-xyz');

    expect(res.status).toBe(401);
  });
});

describe('Public Routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  it('allows access to /api/routes without authentication', async () => {
    const res = await request(app).get('/api/routes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});