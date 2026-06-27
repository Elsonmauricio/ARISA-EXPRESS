// backend/src/routes/routes.ts
import { Router } from 'express';
import { RouteController } from '../controllers/routeController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Rotas públicas (para clientes)
router.get('/available', RouteController.getAvailableRoutes);

// Rotas protegidas (apenas admin/operador)
router.get('/', authenticate, authorize('ADMIN', 'OPERATOR'), RouteController.getRoutes);
router.post('/', authenticate, authorize('ADMIN', 'OPERATOR'), RouteController.upsertRoute);
router.delete('/:id', authenticate, authorize('ADMIN', 'OPERATOR'), RouteController.deleteRoute);
router.post('/init', authenticate, authorize('ADMIN'), RouteController.initRoutes);

export default router;