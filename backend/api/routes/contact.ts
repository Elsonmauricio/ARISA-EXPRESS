// backend/src/routes/contact.ts
import { Router } from 'express';
import { ContactController } from '../../controllers/contactController';
import { rateLimiter } from '../../middleware/rateLimit';

const router = Router();

router.post('/', rateLimiter, ContactController.sendMessage);

export default router;