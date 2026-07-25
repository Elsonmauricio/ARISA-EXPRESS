// backend/src/routes/auth.ts
import { Router } from 'express';
import { AuthController } from '../../controllers/authController';
import { validate } from '../../middleware/validation';
import { authLimiter } from '../../middleware/rateLimit';
import { registerSchema, loginSchema } from '../../types/validation';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', AuthController.getCurrentUser);

export default router;