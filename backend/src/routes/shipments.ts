// backend/src/routes/shipments.ts
import { Router } from 'express';
import { ShipmentController } from '../controllers/shipmentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createShipmentSchema } from '../types/validation';

const router = Router();

router.use(authenticate);
router.post('/', validate(createShipmentSchema), ShipmentController.createShipment);
router.get('/', ShipmentController.getUserShipments);
router.get('/:id', ShipmentController.getShipmentById);
router.patch('/:id', ShipmentController.updateShipment);
router.delete('/:id', ShipmentController.deleteShipment);
router.post('/:id/cancel', ShipmentController.cancelShipment);

export default router;