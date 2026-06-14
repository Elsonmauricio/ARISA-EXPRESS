// backend/src/routes/quotations.ts
import { Router } from 'express';
import { QuotationController } from '../controllers/quotationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.post('/', QuotationController.createQuotation);
router.get('/', QuotationController.getUserQuotations);
router.get('/:id', QuotationController.getQuotationById);
router.post('/:id/approve', QuotationController.approveQuotation);

export default router;