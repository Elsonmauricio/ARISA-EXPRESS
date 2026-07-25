// backend/src/routes/contact.ts
import { Router } from 'express';
import { ContactController } from '../../controllers/contactController';
import { authLimiter } from '../../middleware/rateLimit';

const router = Router();

router.post('/', authLimiter, ContactController.sendMessage);

export default router;