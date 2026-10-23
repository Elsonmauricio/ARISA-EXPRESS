// backend/src/routes/shipments.ts
import { Router } from 'express';
import { ShipmentController } from '../../controllers/shipmentController';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createShipmentSchema, clientUpdateShipmentSchema } from '../../types/validation';

const router = Router();

router.use(authenticate);
router.post('/', validate(createShipmentSchema), ShipmentController.createShipment);
router.get('/', ShipmentController.getUserShipments);
router.get('/:id', ShipmentController.getShipmentById);
// Atualização por cliente: strictObject rejeita price/paidAmount e outros campos não autorizados.
router.patch('/:id', validate(clientUpdateShipmentSchema), ShipmentController.updateShipment);
router.delete('/:id', ShipmentController.deleteShipment);
router.post('/:id/cancel', ShipmentController.cancelShipment);

export default router;