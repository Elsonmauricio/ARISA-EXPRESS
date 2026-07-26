// backend/src/controllers/routeController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';

export const RouteController = {
  // Listar todas as rotas (para admin)
  getRoutes: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('routes').orderBy('flightDate', 'asc').get();
      const routes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        flightDate: data.flightDate?.toDate?.()?.toISOString?.() || data.flightDate || null,
        available: Math.max(0, (data.capacity || 0) - (data.reserved || 0))
      };
    });
      res.json({ success: true, data: routes });
    } catch (error) {
      logger.error('Erro ao buscar rotas:', error);
      res.status(500).json({ error: 'Erro ao buscar rotas' });
    }
  },

  // Listar apenas rotas disponíveis (para clientes) – data futura e capacidade > 0
  getAvailableRoutes: async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const snapshot = await db.collection('routes')
        .where('flightDate', '>=', now)
        .orderBy('flightDate', 'asc')
        .get();

      const routes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          flightDate: data.flightDate?.toDate?.()?.toISOString?.() || data.flightDate || null,
          available: Math.max(0, (data.capacity || 0) - (data.reserved || 0))
        };
      }).filter(r => r.available > 0); // Apenas com capacidade disponível

      res.json({ success: true, data: routes });
    } catch (error) {
      logger.error('Erro ao buscar rotas disponíveis:', error);
      res.status(500).json({ error: 'Erro ao buscar rotas disponíveis' });
    }
  },

  // Criar/atualizar rota (apenas admin)
  upsertRoute: async (req: Request, res: Response) => {
    try {
      const { id, origin, destination, serviceType, pricePerKg, flightDate, capacity } = req.body;

      if (!origin || !destination || !serviceType || !pricePerKg || !flightDate) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      // Converter flightDate para Date
      const flightDateObj = new Date(flightDate);
      if (isNaN(flightDateObj.getTime())) {
        return res.status(400).json({ error: 'Data do voo inválida' });
      }

      const routeData = {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        serviceType,
        pricePerKg: parseFloat(pricePerKg),
        flightDate: flightDateObj,
        capacity: parseFloat(capacity) || 0,
        reserved: 0,
        updatedAt: FieldValue.serverTimestamp()
      };

      let docRef;
      if (id) {
        docRef = db.collection('routes').doc(id);
        // Não sobrescrever 'reserved' e 'createdAt'
        await docRef.update({
          ...routeData,
          reserved: FieldValue.serverTimestamp() // não alterar reserved
        });
        // Corrigir: não usar serverTimestamp para reserved
        await docRef.update({
          ...routeData,
          reserved: 0 // ou manter o existente? Vamos buscar o doc primeiro.
        });
        // Melhor: buscar o doc existente e atualizar mantendo reserved
        const existing = await docRef.get();
        const existingData = existing.data();
        await docRef.update({
          ...routeData,
          reserved: existingData?.reserved || 0,
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        docRef = await db.collection('routes').add({
          ...routeData,
          reserved: 0,
          createdAt: FieldValue.serverTimestamp()
        });
      }

      const newDoc = await docRef.get();
      const data = newDoc.data();
      res.json({
        success: true,
        data: { id: docRef.id, ...data, available: Math.max(0, (data?.capacity || 0) - (data?.reserved || 0)) }
      });
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

  // Atualizar status da rota e propagar para encomendas associadas
  updateRouteStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da rota é obrigatório' });
      }

      if (!['SCHEDULED', 'DEPARTED', 'ARRIVED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use: SCHEDULED, DEPARTED, ARRIVED ou CANCELLED' });
      }

      const routeRef = db.collection('routes').doc(id);
      const routeDoc = await routeRef.get();

      if (!routeDoc.exists) {
        return res.status(404).json({ error: 'Rota não encontrada' });
      }

      await routeRef.update({
        status,
        updatedAt: FieldValue.serverTimestamp()
      });

      const updatedRoute = await routeRef.get();
      const routeData = updatedRoute.data();

      let affectedShipments = 0;

      if (status === 'DEPARTED') {
        const snapshot = await db.collection('shipments')
          .where('routeId', '==', id)
          .where('status', 'in', ['PENDING', 'COLLECTED'])
          .get();

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'IN_TRANSIT',
            updatedAt: FieldValue.serverTimestamp()
          });
          batch.set(doc.ref.collection('trackingUpdates').doc(), {
            status: 'IN_TRANSIT',
            location: routeData?.destination || 'N/A',
            description: 'Rota partiu. Encomenda em trânsito.',
            timestamp: FieldValue.serverTimestamp()
          });
          affectedShipments++;
        });
        await batch.commit();
      }

      if (status === 'ARRIVED') {
        const snapshot = await db.collection('shipments')
          .where('routeId', '==', id)
          .where('status', 'in', ['PENDING', 'COLLECTED', 'IN_TRANSIT', 'CUSTOMS'])
          .get();

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'IN_ANGOLA',
            updatedAt: FieldValue.serverTimestamp()
          });
          batch.set(doc.ref.collection('trackingUpdates').doc(), {
            status: 'IN_ANGOLA',
            location: routeData?.destination || 'N/A',
            description: 'Rota chegou ao destino.',
            timestamp: FieldValue.serverTimestamp()
          });
          affectedShipments++;
        });
        await batch.commit();
      }

      if (status === 'CANCELLED') {
        const snapshot = await db.collection('shipments')
          .where('routeId', '==', id)
          .where('status', 'not-in', ['DELIVERED', 'CANCELLED'])
          .get();

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'CANCELLED',
            updatedAt: FieldValue.serverTimestamp()
          });
          batch.set(doc.ref.collection('trackingUpdates').doc(), {
            status: 'CANCELLED',
            location: routeData?.destination || 'N/A',
            description: 'Rota cancelada.',
            timestamp: FieldValue.serverTimestamp()
          });
          affectedShipments++;
        });
        await batch.commit();
      }

      res.json({ success: true, data: { id, status, affectedShipments } });
    } catch (error) {
      logger.error('Erro ao atualizar status da rota:', error);
      res.status(500).json({ error: 'Erro ao atualizar status da rota' });
    }
  },

  // Inicializar rotas padrão (executar uma vez)
  initRoutes: async (req: Request, res: Response) => {
    try {
      const defaultRoutes = [
        { origin: 'Lisboa', destination: 'Luanda', serviceType: 'REDIRECT', pricePerKg: 13, flightDate: new Date(Date.now() + 7 * 86400000), capacity: 500 },
        { origin: 'Lisboa', destination: 'Luanda', serviceType: 'COURIER', pricePerKg: 9, flightDate: new Date(Date.now() + 7 * 86400000), capacity: 300 },
        { origin: 'Lisboa', destination: 'Luanda', serviceType: 'PERSONAL_SHOPPER', pricePerKg: 4, flightDate: new Date(Date.now() + 14 * 86400000), capacity: 1000 },
        { origin: 'Porto', destination: 'Luanda', serviceType: 'REDIRECT', pricePerKg: 14, flightDate: new Date(Date.now() + 3 * 86400000), capacity: 200 },
        { origin: 'Porto', destination: 'Luanda', serviceType: 'COURIER', pricePerKg: 10, flightDate: new Date(Date.now() + 3 * 86400000), capacity: 150 },
        { origin: 'Porto', destination: 'Luanda', serviceType: 'PERSONAL_SHOPPER', pricePerKg: 5, flightDate: new Date(Date.now() + 10 * 86400000), capacity: 800 },
        { origin: 'Lisboa', destination: 'Benguela', serviceType: 'REDIRECT', pricePerKg: 15, flightDate: new Date(Date.now() + 5 * 86400000), capacity: 100 },
        { origin: 'Lisboa', destination: 'Benguela', serviceType: 'COURIER', pricePerKg: 11, flightDate: new Date(Date.now() + 5 * 86400000), capacity: 80 },
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