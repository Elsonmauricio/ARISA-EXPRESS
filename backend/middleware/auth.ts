// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      logger.warn('[Auth] Token ausente no header Authorization');
      throw new Error();
    }

    if (!process.env.JWT_SECRET) {
      logger.error('[Auth] JWT_SECRET não está definido no .env');
      throw new Error();
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (jwtError: any) {
      logger.warn(`[Auth] Token JWT inválido: ${jwtError.message}`);
      throw new Error();
    }

    const userDoc = await db.collection('users').doc(decoded.id).get();
    if (!userDoc.exists) {
      logger.warn(`[Auth] User doc não encontrado para id=${decoded.id}`);
      throw new Error();
    }

    req.user = { id: userDoc.id, ...userDoc.data() };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Por favor, autentique-se' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
};

export const authenticateRefresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');
    if (!refreshToken) throw new Error();

    const tokenDoc = await db.collection('refreshTokens').doc(refreshToken).get();
    if (!tokenDoc.exists) throw new Error();

    const tokenData = tokenDoc.data() as any;
    if (tokenData.expiresAt?.toDate?.() < new Date()) {
      await tokenDoc.ref.delete();
      throw new Error();
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
};