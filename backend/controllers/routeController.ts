// backend/src/controllers/routeController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';
import { invalidateCache } from '../middleware/cache';
// DESATIVADO: SMS service não configurado
// import { getSmsNotificationService } from '../services/sms';
import { formatDate } from '../utils/businessDays';
import { sendEmail } from '../services/emailService';

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
        status_atual: 'SCHEDULED',
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

      const ROUTE_STATUS_MAP: Record<string, { shipmentStatus: string; description: string }> = {
        CARGA_RECEBIDA: { shipmentStatus: 'COLLECTED', description: 'Carga recebida na origem' },
        PROCESSAMENTO: { shipmentStatus: 'PENDING', description: 'Carga em processamento' },
        TRANSITO_AEREO: { shipmentStatus: 'IN_TRANSIT', description: 'Voo em curso' },
        DESESPACHO: { shipmentStatus: 'CUSTOMS', description: 'Em desalfandegamento' },
        HUB_DESTINO: { shipmentStatus: 'HUB_DESTINO', description: 'Chegou ao hub de destino' },
        READY_FOR_PICKUP: { shipmentStatus: 'READY_FOR_PICKUP', description: 'Disponível para levantamento' },
        ROTA_CONCLUIDA: { shipmentStatus: 'DELIVERED', description: 'Rota concluída' },
      };

      if (!ROUTE_STATUS_MAP[status]) {
        return res.status(400).json({ error: 'Status inválido. Use: CARGA_RECEBIDA, PROCESSAMENTO, TRANSITO_AEREO, DESESPACHO, HUB_DESTINO, READY_FOR_PICKUP ou ROTA_CONCLUIDA' });
      }

      const routeRef = db.collection('routes').doc(id);
      const routeDoc = await routeRef.get();

      if (!routeDoc.exists) {
        return res.status(404).json({ error: 'Rota não encontrada' });
      }

      const routeData = routeDoc.data() as any;
      const oldRouteStatus = routeData?.status || routeData?.status_atual || 'N/A';

      logger.info(`[RouteStatus] === UPDATE ROUTE ${id} ===`);
      logger.info(`[RouteStatus] Route: ${routeData?.origin || '?'} → ${routeData?.destination || '?'}`);
      logger.info(`[RouteStatus] Status change: ${oldRouteStatus} → ${status}`);
      logger.info(`[RouteStatus] Mapping: route status "${status}" → shipment status "${ROUTE_STATUS_MAP[status].shipmentStatus}"`);

      await routeRef.update({
        status,
        status_atual: status,
        updatedAt: FieldValue.serverTimestamp()
      });

      logger.info(`[RouteStatus] ✅ Route document updated in Firestore`);

      const routeDest = String(routeData?.destination || '').toLowerCase();
      const isRouteLuanda = routeDest.includes('luanda') || routeDest.includes('angola');
      const routeDestLabel = isRouteLuanda ? 'Luanda (Angola)' : 'Lisboa (Portugal)';

      const mapResult = ROUTE_STATUS_MAP[status];
      let shipmentStatus = mapResult.shipmentStatus;

      if (status === 'HUB_DESTINO') {
        shipmentStatus = isRouteLuanda ? 'IN_ANGOLA' : 'IN_PORTUGAL';
        logger.info(`[RouteStatus] HUB_DESTINO: route destination is ${routeData?.destination} → shipmentStatus = ${shipmentStatus}`);
      }

      logger.info(`[RouteStatus] Final shipment status to apply: ${shipmentStatus}`);

      // Build route string to match shipments (covers both routeId and route string)
      const routeString = `${routeData?.origin || ''} » ${routeData?.destination || ''}`;

      // Fetch shipments matching this route (by routeId for new shipments, by route string for legacy)
      let shipmentSnapshot;
      try {
        shipmentSnapshot = await db.collection('shipments')
          .where('routeId', '==', id)
          .get();
      } catch {
        shipmentSnapshot = { empty: true, docs: [], size: 0 } as any;
      }

      let shippedInStandardFlow = shipmentSnapshot.size;

      if (shipmentSnapshot.empty) {
        // Fallback: try matching by route string (for shipments without routeId)
        try {
          const stringSnapshot = await db.collection('shipments')
            .where('route', '==', routeString)
            .get();
          shippedInStandardFlow = stringSnapshot.size;
          shipmentSnapshot = stringSnapshot;
        } catch {
          shipmentSnapshot = { empty: true, docs: [], size: 0 } as any;
        }
      }

      if (shipmentSnapshot.empty) {
        // Second fallback: try title-case route string for admin-created shipments
        try {
          const titleCaseString = `${routeData?.origin || ''} » ${routeData?.destination || ''}`.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
          const stringSnapshot2 = await db.collection('shipments')
            .where('route', '==', titleCaseString)
            .get();
          shippedInStandardFlow = stringSnapshot2.size;
          shipmentSnapshot = stringSnapshot2;
        } catch {
          shipmentSnapshot = { empty: true, docs: [], size: 0 } as any;
        }
      }

      logger.info(`[RouteStatus] Shipments in standard flow (status_proprio=null): ${shippedInStandardFlow}`);

      if (shipmentSnapshot.empty) {
        logger.info(`[RouteStatus] ℹ️ No shipments to update for route ${id}`);
        return res.json({ success: true, data: { id, status, shipmentStatus, affectedShipments: 0, whatsappReady: 0 } });
      }

      const batch = db.batch();
      let notifCount = 0;
      const shipmentIds: string[] = [];

            shipmentSnapshot.docs.forEach((doc: any) => {
        const s = doc.data() as any;
        if (s.status_proprio != null || s.is_custom_status === true) {
          logger.info(`[RouteStatus] Skipping shipment ${doc.id} — has custom status`);
          return;
        }
        logger.info(`[RouteStatus] 🔄 Processing shipment ${doc.id} (${s.trackingCode || 'N/A'})`);
        logger.info(`[RouteStatus]   Current: status=${s.status || '?'} | is_custom_status=${s.is_custom_status ? 'true' : 'false'} | status_proprio=${s.status_proprio || 'null'}`);
        logger.info(`[RouteStatus]   Will update: status=${shipmentStatus} | currentLocation=${routeData?.destination || 'N/A'}`);

        const updateData: any = {
          status: shipmentStatus,
          status_atual: status,
          currentLocation: routeData?.destination || 'N/A',
          updatedAt: FieldValue.serverTimestamp()
        };

        if (shipmentStatus === 'READY_FOR_PICKUP') {
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 5);
          updateData.readyForPickupAt = FieldValue.serverTimestamp();
          updateData.pickupDeadline = deadline;
          updateData.pickupAddress = isRouteLuanda
            ? 'Morro Bento\nAvenida 21 de Janeiro\nDefronte ao Hotel Ágatha\nNo lado oposto ao Hotel Ágatha\nNa entrada à esquerda da farmácia Elvice, antes do Colégio GAB 2 está a Arisa Express'
            : 'Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2630-328 Santo António dos Cavaleiros';
          updateData.pickupContact = isRouteLuanda ? '+244 948 440 920' : '+351 934 292 082';

          if (s.receiverPhone || s.senderPhone) { notifCount++ }
          logger.info(`[RouteStatus]   READY_FOR_PICKUP: pickupAddress=${isRouteLuanda ? 'Luanda' : 'Lisbon'}, whatsappReady: ${s.receiverPhone || s.senderPhone ? 'yes' : 'no'}`);

          const pickupPhone = (s.receiverPhone || s.senderPhone || '').replace(/\D/g, '');
          if (pickupPhone.length >= 9) {
            // DESATIVADO: SMS service não configurado
            // const smsService = getSmsNotificationService();
            // const readyDate = new Date();
            // const deadlineStr = formatDate(deadline);
            // const enqueued = smsService.enqueuePickupNotification({
            //   shipmentId: doc.id,
            //   trackingCode: s.trackingCode || '',
            //   phone: pickupPhone,
            //   data: {
            //     readyDate: formatDate(readyDate),
            //     deadline: deadlineStr,
            //     senderName: s.senderName || 'N/A',
            //     receiverName: s.receiverName || 'N/A',
            //     pickupAddress: updateData.pickupAddress,
            //     pickupContact: updateData.pickupContact,
            //     pickupSchedule: updateData.pickupSchedule || '',
            //     destination: routeData?.destination || ''
            //   }
            // });
            // logger.info(`[SMS] Enqueue result for ${s.trackingCode}: ${enqueued ? 'queued' : 'skipped (invalid phone)'}`);
          } else {
            logger.warn(`[SMS] Skipped for shipment ${s.trackingCode}: no valid phone (receiverPhone=${s.receiverPhone || 'null'}, senderPhone=${s.senderPhone || 'null'})`);
          }
        }

        if (shipmentStatus === 'PICKED_UP') {
          updateData.pickedUpAt = FieldValue.serverTimestamp();
          updateData.pickupDeadline = null;
          logger.info(`[RouteStatus]   PICKED_UP: pickedUpAt set, pickupDeadline cleared`);
        }

        if (shipmentStatus === 'DELIVERED') {
          updateData.actualDelivery = FieldValue.serverTimestamp();
          logger.info(`[RouteStatus]   DELIVERED: actualDelivery timestamp set`);
        }

        batch.update(doc.ref, updateData);
        batch.set(doc.ref.collection('trackingUpdates').doc(), {
          status: shipmentStatus,
          location: routeDestLabel,
          description: mapResult.description,
          timestamp: FieldValue.serverTimestamp()
        });
        shipmentIds.push(doc.id);
      });

      await batch.commit();
      invalidateCache('admin:stats');
      logger.info(`[RouteStatus] === SUMMARY ===`);
      logger.info(`[RouteStatus] Route ${id}: ${oldRouteStatus} → ${status} (shipmentStatus: ${shipmentStatus})`);
      logger.info(`[RouteStatus] ✅ ${shipmentIds.length} shipments updated in Firestore`);
      logger.info(`[RouteStatus] 📱 ${notifCount} shipments ready for WhatsApp notification`);
      logger.info(`[RouteStatus] 🔗 Affected IDs: ${JSON.stringify(shipmentIds)}`);
      logger.info(`[RouteStatus] === END ===`);

      for (const shipmentId of shipmentIds) {
        try {
          const shipmentDoc = await db.collection('shipments').doc(shipmentId).get();
          const shipment = shipmentDoc.data() as any;
          if (!shipment) continue;

          const contactEmail = shipment.receiverContact || shipment.senderContact;
          if (contactEmail && contactEmail.includes('@')) {
            await sendEmail({
              to: contactEmail,
              subject: ` Atualização da Encomenda ${shipment.trackingCode}`,
              template: 'shipment-updated',
              data: {
                name: shipment.receiverName || shipment.senderName || 'Cliente',
                trackingCode: shipment.trackingCode,
                status: shipmentStatus,
                location: routeData?.destination || 'N/A',
                description: mapResult.description
              }
            });
          }
        } catch (emailError: any) {
          logger.error(`[RouteStatus] Erro ao enviar email para encomenda ${shipmentId}:`, emailError);
        }
      }

      res.json({
        success: true,
        data: { id, status, shipmentStatus, affectedShipments: shipmentIds.length, shipmentIds, whatsappReady: notifCount }
      });
    } catch (error) {
      logger.error('[RouteStatus] ❌ Error updating route status:', error);
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