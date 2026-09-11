// backend/src/routes/shipments.ts
import { Router } from 'express';
import { ShipmentController } from '../../controllers/shipmentController';
import { PaymentProofController } from '../../controllers/paymentProofController';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createShipmentSchema } from '../../types/validation';
import { uploadPaymentProof } from '../../middleware/upload';

const router = Router();

router.use(authenticate);
router.post('/', validate(createShipmentSchema), ShipmentController.createShipment);
router.get('/', ShipmentController.getUserShipments);
router.get('/:id', ShipmentController.getShipmentById);
router.patch('/:id', ShipmentController.updateShipment);
router.delete('/:id', ShipmentController.deleteShipment);
router.post('/:id/cancel', ShipmentController.cancelShipment);
router.post('/:id/payment-proof', uploadPaymentProof.single('proof'), PaymentProofController.uploadPaymentProof);

export default router;