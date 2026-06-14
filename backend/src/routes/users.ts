// backend/src/routes/users.ts
import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.patch('/profile', UserController.updateProfile);
router.patch('/change-password', UserController.changePassword);
router.get('/notifications', UserController.getNotifications);
router.patch('/notifications/:id/read', UserController.markNotificationRead);

export default router;