// backend/src/routes/tracking.ts
import { Router } from 'express';
import { TrackingController } from '../controllers/trackingController';

const router = Router();

router.get('/:code', TrackingController.getTrackingInfo);

export default router;