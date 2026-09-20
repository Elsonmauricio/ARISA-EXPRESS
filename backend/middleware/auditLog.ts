// backend/src/middleware/auditLog.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

export interface AuditLogData {
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
}

export async function auditLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  const originalJson = res.json.bind(res);
  const userId = req.user?.id || null;
  const userEmail = req.user?.email || null;
  const userRole = req.user?.role || null;
  const ip = req.ip || req.connection.remoteAddress || null;
  const method = req.method;
  const path = req.originalUrl;

  res.json = function (body: any) {
    const statusCode = res.statusCode;
    const isMutation = ['POST', 'PATCH', 'DELETE'].includes(method);

    if (isMutation && body?.success && userId) {
      const log: any = {
        userId,
        userEmail,
        userRole,
        ip,
        method,
        path,
        statusCode,
        timestamp: new Date().toISOString(),
        resource: path.split('/').pop() || path,
        resourceId: req.params.id || null,
        body: sanitizeBody(req.body)
      };

      if (req.params.id && req.body) {
        log.changes = computeChanges(req);
      }

      db.collection('auditLogs').add(log).catch((err) => {
        logger.error('Failed to write audit log:', err);
      });

      logger.info('[AUDIT]', JSON.stringify(log));
    }

    return originalJson(body);
  };

  next();
}

function sanitizeBody(body: any): any {
  if (!body) return null;
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  return sanitized;
}

function computeChanges(req: Request): Record<string, { from: any; to: any }> | undefined {
  const resourceId = req.params.id;
  if (!resourceId || !req.body) return undefined;

  const changes: Record<string, { from: any; to: any }> = {};
  for (const [key, value] of Object.entries(req.body)) {
    changes[key] = { from: '(previous)', to: value };
  }
  return changes;
}
