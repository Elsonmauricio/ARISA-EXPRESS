// backend/src/routes/contact.ts
import { Router } from 'express';
import { ContactController } from '../controllers/contactController';

const router = Router();

router.post('/', ContactController.sendMessage);

export default router;