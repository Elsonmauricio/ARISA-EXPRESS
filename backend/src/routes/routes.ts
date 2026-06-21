// backend/src/routes/routes.ts
import { Router } from 'express';
import { RouteController } from '../controllers/routeController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Rotas públicas (listar rotas)
router.get('/', RouteController.getRoutes);

// Rotas protegidas (apenas admin/operador)
router.post('/', authenticate, authorize('ADMIN', 'OPERATOR'), RouteController.upsertRoute);
router.delete('/:id', authenticate, authorize('ADMIN', 'OPERATOR'), RouteController.deleteRoute);
router.post('/init', authenticate, authorize('ADMIN'), RouteController.initRoutes);

export default router;