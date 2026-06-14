// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(error.stack);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ error: 'Erro na operação com banco de dados' });
  }
  
  const status = error.status || 500;
  const message = error.message || 'Erro interno do servidor';
  
  res.status(status).json({ error: message });
};