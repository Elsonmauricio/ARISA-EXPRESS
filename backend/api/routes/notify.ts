// backend/src/api/routes/notify.ts
import { Router } from 'express';
import { NotifyController } from '../../controllers/notifyController';

const router = Router();

router.post('/notify-whatsapp', NotifyController.sendPickupNotification);

export default router;
