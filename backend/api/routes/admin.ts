// backend/src/routes/admin.ts
import { Router } from 'express';
import { AdminController } from '../../controllers/adminController';
import { LeadController } from '../../controllers/leadController';
import { ExportController } from '../../controllers/exportController';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { auditLog } from '../../middleware/auditLog';
import { adminCreateShipmentSchema, updateCttSchema, batchStatusUpdateSchema, batchByIdsSchema } from '../../types/validation';
import { getSmsNotificationService } from '../../services/sms';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'OPERATOR'));

router.get('/stats', AdminController.getStats);
router.get('/stats/trends', AdminController.getTrends);
router.get('/shipments', AdminController.getAllShipments);
router.get('/shipments/search', AdminController.searchShipments);

router.patch('/shipments/batch-status', validate(batchStatusUpdateSchema), auditLog, AdminController.batchUpdateStatus);

router.get('/shipments/ready-for-pickup', AdminController.getReadyForPickup);
router.get('/shipments/:id', AdminController.getShipmentDetails);
router.post('/shipments', validate(adminCreateShipmentSchema), auditLog, AdminController.createShipment);
router.patch('/shipments/:id/status', auditLog, AdminController.updateShipmentStatus);
router.patch('/shipments/:id/ctt', validate(updateCttSchema), auditLog, AdminController.updateCtt);
router.patch('/shipments/batch-status-by-ids', validate(batchByIdsSchema), auditLog, AdminController.batchUpdateByIds);

router.get('/shipments/:id/whatsapp-link', AdminController.generateWhatsAppLink);
router.get('/shipments/:id/whatsapp-payment', AdminController.generateWhatsAppPaymentLink);
router.get('/shipments/:id/fine', AdminController.calculateShipmentFine);
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id/role', auditLog, AdminController.changeUserRole);
router.delete('/users/:id', auditLog, AdminController.deleteUser);

router.get('/leads', LeadController.getLeads);
router.get('/leads/pipeline', LeadController.getLeadPipeline);
router.patch('/leads/:id/read', auditLog, LeadController.markAsRead);
router.patch('/leads/:id/stage', auditLog, LeadController.updateLeadStage);
router.patch('/leads/:id/assign', auditLog, LeadController.assignLead);
router.patch('/leads/:id/tags', auditLog, LeadController.updateLeadTags);
router.post('/leads/:id/notes', auditLog, LeadController.addLeadNote);
router.delete('/leads/:id', auditLog, LeadController.deleteLead);

router.get('/export/shipments', ExportController.exportShipments);
router.get('/export/users', ExportController.exportUsers);
router.get('/export/leads', ExportController.exportLeads);
router.get('/backup/full', ExportController.fullBackup);

router.get('/notifications/sms/queue', (req, res) => {
  const svc = getSmsNotificationService();
  res.json({ success: true, queueLength: svc.getQueueLength() });
});

export default router;
