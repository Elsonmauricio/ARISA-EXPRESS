// backend/src/controllers/quotationController.ts
import { Request, Response } from 'express';
import { db, admin } from '../config/firebase';

export const QuotationController = {
  createQuotation: async (req: Request, res: Response) => {
    try {
      const { origin, destination, weight, dimensions, serviceType } = req.body;
      const user = (req as any).user;
      const price = QuotationController.calculatePrice(weight, serviceType);
      
      const quotationData = {
        userId: user.id,
        origin,
        destination,
        weight: parseFloat(weight),
        dimensions: dimensions || {},
        serviceType,
        price,
        status: 'PENDING',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('quotations').add(quotationData);
      
      res.status(201).json({ success: true, data: { id: docRef.id, ...quotationData } });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar orçamento' });
    }
  },
  
  getUserQuotations: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const snapshot = await db.collection('quotations')
        .where('userId', '==', user.id)
        .orderBy('createdAt', 'desc')
        .get();
      
      const quotations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      res.json({ success: true, data: quotations });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar orçamentos' });
    }
  },
  
  getQuotationById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const doc = await db.collection('quotations').doc(id).get();
      
      if (!doc.exists || doc.data()?.userId !== user.id) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }
      
      res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar orçamento' });
    }
  },
  
  approveQuotation: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.collection('quotations').doc(id).update({ status: 'APPROVED' });
      res.json({ success: true, message: 'Orçamento aprovado' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao aprovar orçamento' });
    }
  },
  
  calculatePrice: (weight: number, serviceType: string): number => {
    const rates: Record<string, number> = { AIR_EXPRESS: 25, AIR_ECONOMY: 15, MARITIME: 5, BUSINESS: 35 };
    return Math.round(rates[serviceType] * weight * 100) / 100;
  }
};