// backend/src/routes/users.ts
import { Router } from 'express';
import { UserController } from '../../controllers/userController';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { updateProfileSchema, changePasswordSchema } from '../../types/validation';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.patch('/profile', validate(updateProfileSchema), UserController.updateProfile);
router.patch('/change-password', validate(changePasswordSchema), UserController.changePassword);
router.get('/notifications', UserController.getNotifications);
router.patch('/notifications/:id/read', UserController.markNotificationRead);

export default router;