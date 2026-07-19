// backend/src/routes/admin.ts
import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { LeadController } from '../controllers/leadController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Protege todas as rotas de admin
router.use(authenticate);
router.use(authorize('ADMIN', 'OPERATOR'));

// Rotas existentes
router.get('/stats', AdminController.getStats);
router.get('/shipments', AdminController.getAllShipments);
router.get('/shipments/:id', AdminController.getShipmentDetails);
router.patch('/shipments/:id/status', AdminController.updateShipmentStatus);
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id/role', AdminController.changeUserRole);
router.delete('/users/:id', AdminController.deleteUser);

// Rotas para leads
router.get('/leads', LeadController.getLeads);
router.get('/leads/pipeline', LeadController.getLeadPipeline);
router.patch('/leads/:id/read', LeadController.markAsRead);
router.patch('/leads/:id/stage', LeadController.updateLeadStage);
router.patch('/leads/:id/assign', LeadController.assignLead);
router.patch('/leads/:id/tags', LeadController.updateLeadTags);
router.post('/leads/:id/notes', LeadController.addLeadNote);
router.delete('/leads/:id', LeadController.deleteLead);

export default router;
