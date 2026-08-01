// backend/src/routes/admin.ts
import { Router } from 'express';
import { AdminController } from '../../controllers/adminController';
import { LeadController } from '../../controllers/leadController';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { adminCreateShipmentSchema, updateCttSchema } from '../../types/validation';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'OPERATOR'));

router.get('/stats', AdminController.getStats);
router.get('/shipments', AdminController.getAllShipments);
router.get('/shipments/search', AdminController.searchShipments);

router.get('/shipments/ready-for-pickup', AdminController.getReadyForPickup);
router.get('/shipments/:id', AdminController.getShipmentDetails);
router.post('/shipments', validate(adminCreateShipmentSchema), AdminController.createShipment);
router.patch('/shipments/:id/status', AdminController.updateShipmentStatus);
router.patch('/shipments/:id/ctt', validate(updateCttSchema), AdminController.updateCtt);

router.get('/shipments/:id/whatsapp', AdminController.generateWhatsAppNotification);
router.get('/shipments/:id/fine', AdminController.calculateShipmentFine);
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id/role', AdminController.changeUserRole);
router.delete('/users/:id', AdminController.deleteUser);

router.get('/leads', LeadController.getLeads);
router.get('/leads/pipeline', LeadController.getLeadPipeline);
router.patch('/leads/:id/read', LeadController.markAsRead);
router.patch('/leads/:id/stage', LeadController.updateLeadStage);
router.patch('/leads/:id/assign', LeadController.assignLead);
router.patch('/leads/:id/tags', LeadController.updateLeadTags);
router.post('/leads/:id/notes', LeadController.addLeadNote);
router.delete('/leads/:id', LeadController.deleteLead);

export default router;
