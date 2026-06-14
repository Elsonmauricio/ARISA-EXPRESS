// backend/src/routes/admin.ts
import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'OPERATOR'));

router.get('/stats', AdminController.getStats);
router.get('/shipments', AdminController.getAllShipments);
router.get('/shipments/:id', AdminController.getShipmentDetails);
router.patch('/shipments/:id/status', AdminController.updateShipmentStatus);
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id/role', AdminController.changeUserRole);
router.delete('/users/:id', AdminController.deleteUser);

export default router;