// backend/src/controllers/routeController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';

export const RouteController = {
  // Listar todas as rotas com disponibilidade
  getRoutes: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('routes').get();
      const routes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          available: Math.max(0, (data.capacity || 0) - (data.reserved || 0))
        };
      });
      res.json({ success: true, data: routes });
    } catch (error) {
      logger.error('Erro ao buscar rotas:', error);
      res.status(500).json({ error: 'Erro ao buscar rotas' });
    }
  },

  // Criar/atualizar rota (apenas admin)
  upsertRoute: async (req: Request, res: Response) => {
    try {
      const { id, origin, destination, serviceType, pricePerKg, estimatedDays, capacity, flightDate } = req.body;
        const routeData = {
        origin,
        destination,
        serviceType,
        pricePerKg,
        flightDate: flightDate ? new Date(flightDate) : null,  // espera ISO string
        capacity: capacity || 0,
        reserved: 0,
        updatedAt: FieldValue.serverTimestamp()
        };

      let docRef;
      if (id) {
        docRef = db.collection('routes').doc(id);
        await docRef.update(routeData);
      } else {
        docRef = await db.collection('routes').add({
          ...routeData,
          createdAt: FieldValue.serverTimestamp()
        });
      }

      res.json({ success: true, data: { id: docRef.id || id, ...routeData } });
    } catch (error) {
      logger.error('Erro ao guardar rota:', error);
      res.status(500).json({ error: 'Erro ao guardar rota' });
    }
  },

  // Eliminar rota
  deleteRoute: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.collection('routes').doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao eliminar rota:', error);
      res.status(500).json({ error: 'Erro ao eliminar rota' });
    }
  },

  // Inicializar rotas padrão (executar uma vez)
  initRoutes: async (req: Request, res: Response) => {
    try {
      const defaultRoutes = [
        { origin: 'Lisboa', destination: 'Luanda', serviceType: 'AIR_EXPRESS', pricePerKg: 13, estimatedDays: 2, capacity: 500 },
        { origin: 'Lisboa', destination: 'Luanda', serviceType: 'AIR_ECONOMY', pricePerKg: 9, estimatedDays: 5, capacity: 300 },
        { origin: 'Lisboa', destination: 'Luanda', serviceType: 'MARITIME', pricePerKg: 4, estimatedDays: 14, capacity: 1000 },
        { origin: 'Porto', destination: 'Luanda', serviceType: 'AIR_EXPRESS', pricePerKg: 14, estimatedDays: 2, capacity: 200 },
        { origin: 'Porto', destination: 'Luanda', serviceType: 'AIR_ECONOMY', pricePerKg: 10, estimatedDays: 5, capacity: 150 },
        { origin: 'Porto', destination: 'Luanda', serviceType: 'MARITIME', pricePerKg: 5, estimatedDays: 14, capacity: 800 },
        { origin: 'Lisboa', destination: 'Benguela', serviceType: 'AIR_EXPRESS', pricePerKg: 15, estimatedDays: 3, capacity: 100 },
        { origin: 'Lisboa', destination: 'Benguela', serviceType: 'AIR_ECONOMY', pricePerKg: 11, estimatedDays: 6, capacity: 80 },
      ];

      const batch = db.batch();
      for (const route of defaultRoutes) {
        const docRef = db.collection('routes').doc();
        batch.set(docRef, {
          ...route,
          reserved: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
      await batch.commit();

      res.json({ success: true, message: 'Rotas padrão criadas com sucesso' });
    } catch (error) {
      logger.error('Erro ao inicializar rotas:', error);
      res.status(500).json({ error: 'Erro ao inicializar rotas' });
    }
  }
};