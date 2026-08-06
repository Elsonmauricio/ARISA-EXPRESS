// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
const isProduction = process.env.NODE_ENV === 'production';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (!isProduction && req.method === 'GET' && req.path === '/api/routes/available') {
      return true;
    }
    return false;
  },
  message: 'Muitas requisições, tente novamente mais tarde'
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login, tente novamente em 1 hora'
});