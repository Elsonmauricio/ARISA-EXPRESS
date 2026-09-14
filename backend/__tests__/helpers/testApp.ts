/**
 * Helper to create a minimal Express app for Supertest without
 * starting the real Firebase connection.
 */
import express from 'express';
import jwt from 'jsonwebtoken';

export function createTestApp() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Auth endpoints (mocked)
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@teste.com' && password === '123456') {
      const token = jwt.sign(
        { id: 'mock-admin-id', email, role: 'ADMIN' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      return res.json({ success: true, data: { token, user: { id: 'mock-admin-id', email, role: 'ADMIN' } } });
    }
    if (email === 'client@teste.com' && password === '123456') {
      const token = jwt.sign(
        { id: 'mock-client-id', email, role: 'CLIENT' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      return res.json({ success: true, data: { token, user: { id: 'mock-client-id', email, role: 'CLIENT' } } });
    }
    return res.status(401).json({ error: 'Credenciais inválidas' });
  });

  app.post('/api/auth/refresh', (_req, res) => {
    return res.json({ success: true, data: { token: 'refreshed-token' } });
  });

  // Protected admin routes
  const adminRouter = express.Router();
  adminRouter.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Autentique-se' });
    }
    try {
      const decoded = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'test-secret');
      (req as any).user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  });

  adminRouter.use((req, res, next) => {
    const user = (req as any).user;
    if (!user || !['ADMIN', 'OPERATOR'].includes(user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  });

  adminRouter.get('/stats', (_req, res) => res.json({ success: true, data: {} }));
  adminRouter.get('/shipments', (_req, res) => res.json({ success: true, data: [] }));

  app.use('/api/admin', adminRouter);

  // Public routes
  app.get('/api/routes', (_req, res) =>
    res.json({ success: true, data: [{ id: 'r1', origin: 'Lisboa', destination: 'Luanda' }] })
  );

  return app;
}

export function authHeader(role: 'ADMIN' | 'CLIENT' = 'ADMIN'): string {
  const payload = role === 'ADMIN'
    ? { id: 'mock-admin-id', email: 'admin@teste.com', role: 'ADMIN' }
    : { id: 'mock-client-id', email: 'client@teste.com', role: 'CLIENT' };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  return `Bearer ${token}`;
}