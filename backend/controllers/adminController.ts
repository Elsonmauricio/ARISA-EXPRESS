// backend/src/controllers/adminController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '../services/emailService';
import { logger } from '../utils/logger';
import { addBusinessDays, calculateFine, calculateLocationFine, formatDate, getBusinessDaysBetween, calculateWeeksOverdue } from '../utils/businessDays';
import { generateWhatsAppLink, generateWhatsAppMessage, getLocationType, getPickupImage, isLuandaDestination, formatPhoneToE164, generateCustomWhatsAppLink, guessLocationType } from '../utils/whatsapp';
import { fixEncodingObject } from '../utils/encoding';
import { LocationType } from '../utils/whatsapp';
import { getCached, setCache, invalidateCache } from '../middleware/cache';
// DESATIVADO: WhatsApp Cloud API (sem token/configuração)
// import { WhatsAppService } from '../services/whatsappService';
// DESATIVADO: SMS service (sem provider configurado)
// import { getSmsNotificationService } from '../services/sms';

// Conclusive statuses that trigger individual status flag
const CONCLUSIVE_STATUSES = ['PICKED_UP', 'DELIVERED', 'CANCELLED', 'COLLECTED'];

export const AdminController = {
  tryRegisterClient: async (body: any, shipmentId: string, trackingCode: string) => {
    try {
      const receiverPhone = (body.receiverPhone || '').replace(/\D/g, '');
      const senderPhone = (body.senderPhone || '').replace(/\D/g, '');
      const phoneToFind = receiverPhone || senderPhone;
      if (!phoneToFind || phoneToFind.length < 9) return null;

      let existingUser: any = null;
      const usersSnapshot = await db.collection('users').where('phone', '==', phoneToFind).limit(1).get();
      if (!usersSnapshot.empty) {
        existingUser = usersSnapshot.docs[0];
      }

      if (!existingUser) {
        const clientPhone = phoneToFind.length === 9
          ? (body.destination && String(body.destination).toLowerCase().includes('luanda') ? '244' : '351') + phoneToFind
          : phoneToFind;

        const newUser: any = {
          name: body.receiverName || body.senderName || 'Cliente',
          phone: clientPhone,
          email: body.receiverContact || body.senderContact || '',
          role: 'CLIENT',
          createdAt: FieldValue.serverTimestamp(),
          shipmentsCreated: FieldValue.arrayUnion(shipmentId),
          shipmentCount: 1
        };

        const userDoc = await db.collection('users').add(newUser);
        logger.info('Created new client user for shipment ' + trackingCode);
        return { id: userDoc.id, ...newUser };
      }

      await db.collection('users').doc(existingUser.id).update({
        shipmentsCreated: FieldValue.arrayUnion(shipmentId),
        shipmentCount: FieldValue.increment(1)
      });
      logger.info('Found existing client user for shipment ' + trackingCode);
      return { id: existingUser.id, ...existingUser.data() };
    } catch (err: any) {
      logger.warn('tryRegisterClient failed:', err.message);
      return null;
    }
  },

  getStats: async (req: Request, res: Response) => {
    try {
      const cached = getCached<any>('admin:stats');
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const [totalShipments, activeShipments, totalUsers, pendingShipments, inTransitShipments, readyForPickupShipments, cancelledShipments, totalLeads, newLeads, previousMonthShipments] = await Promise.all([
        db.collection('shipments').count().get(),
        db.collection('shipments').where('status', '!=', 'DELIVERED').count().get(),
        db.collection('users').count().get(),
        db.collection('shipments').where('status', '==', 'PENDING').count().get(),
        db.collection('shipments').where('status', '==', 'IN_TRANSIT').count().get(),
        db.collection('shipments').where('status', '==', 'READY_FOR_PICKUP').count().get(),
        db.collection('shipments').where('status', '==', 'CANCELLED').count().get(),
        db.collection('leads').count().get(),
        db.collection('leads').where('read', '==', false).count().get(),
        db.collection('shipments').where('createdAt', '>=', new Date(previousMonthYear, previousMonth, 1)).where('createdAt', '<', new Date(currentYear, currentMonth, 1)).count().get()
      ]);

      const data = {
        totalShipments: totalShipments.data().count,
        activeShipments: activeShipments.data().count,
        totalUsers: totalUsers.data().count,
        pendingShipments: pendingShipments.data().count,
        inTransitShipments: inTransitShipments.data().count,
        readyForPickupShipments: readyForPickupShipments.data().count,
        cancelledShipments: cancelledShipments.data().count,
        totalLeads: totalLeads.data().count,
        newLeads: newLeads.data().count,
        previousMonthShipments: previousMonthShipments.data().count
      };

      setCache('admin:stats', data, 30000);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  },

  getAllShipments: async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const cursor = req.query.cursor as string | undefined;
      const statusFilter = req.query.status as string | undefined;

      let query: any = db.collection('shipments');

      if (statusFilter && statusFilter !== 'all') {
        query = query.where('status', '==', statusFilter);
      }

      query = query.orderBy('createdAt', 'desc').limit(limit);

      if (cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
          const cursorDoc = await db.collection('shipments').doc(decoded.id).get();
          if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
          }
        } catch {
          // ignore invalid cursor
        }
      }

      const snapshot = await query.get();
      const shipments = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        const statusCalculado = data.status_proprio ?? data.status ?? null;
        return { id: doc.id, ...data, status_calculado: statusCalculado };
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const nextCursor = lastDoc
        ? Buffer.from(JSON.stringify({ id: lastDoc.id, createdAt: lastDoc.data().createdAt?.toMillis?.() || Date.now() })).toString('base64')
        : null;

      const totalSnapshot = await db.collection('shipments').count().get();

      res.json({
        success: true,
        data: shipments,
        pagination: {
          total: totalSnapshot.data().count,
          limit,
          hasMore: snapshot.size === limit,
          nextCursor
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar encomendas:', error);
      res.status(500).json({ error: 'Erro ao buscar encomendas' });
    }
  },

  searchShipments: async (req: Request, res: Response) => {
    try {
      const { q, status, limit = '50', cursor } = req.query;
      const pageSize = Math.min(parseInt(limit as string) || 50, 100);

      let baseQuery: any = db.collection('shipments');

      if (status && status !== 'all') {
        baseQuery = baseQuery.where('status', '==', status);
      }

      let snapshot = await baseQuery.orderBy('createdAt', 'desc').limit(pageSize).get();

      if (cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(cursor as string, 'base64').toString());
          const cursorDoc = await db.collection('shipments').doc(decoded.id).get();
          if (cursorDoc.exists) {
            snapshot = await baseQuery.orderBy('createdAt', 'desc').startAfter(cursorDoc).limit(pageSize).get();
          }
        } catch {
          // ignore invalid cursor
        }
      }

      let shipments = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        const statusCalculado = data.status_proprio ?? data.status ?? null;
        return { id: doc.id, ...data, status_calculado: statusCalculado };
      });

      if (q && typeof q === 'string') {
        const term = q.toLowerCase();
        shipments = shipments.filter((s: any) =>
          (s.trackingCode || '').toLowerCase().includes(term) ||
          (s.senderName || '').toLowerCase().includes(term) ||
          (s.receiverName || '').toLowerCase().includes(term)
        );
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const nextCursor = lastDoc
        ? Buffer.from(JSON.stringify({ id: lastDoc.id, createdAt: lastDoc.data().createdAt?.toMillis?.() || Date.now() })).toString('base64')
        : null;

      res.json({
        success: true,
        data: shipments,
        pagination: {
          limit: pageSize,
          hasMore: snapshot.size === pageSize,
          nextCursor
        }
      });
    } catch (error) {
      logger.error('Erro ao pesquisar encomendas:', error);
      res.status(500).json({ error: 'Erro ao pesquisar encomendas' });
    }
  },

  createShipment: async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const user = (req as any).user;

      const trackingCode = body.trackingCode || `AE-${new Date().getFullYear()}-${require('crypto').randomBytes(2).toString('hex').toUpperCase()}`;
      const route = (body.route || `${body.origin} » ${body.destination}`).toUpperCase();
      const weightNum = parseFloat(body.weight) || 0;

      let routeId = body.routeId || null;
      let matchedRouteDoc: any = null;

      if (!routeId && body.origin && body.destination) {
        const routeQuery = await db.collection('routes')
          .where('origin', '==', String(body.origin).toUpperCase())
          .where('destination', '==', String(body.destination).toUpperCase())
          .where('serviceType', '==', body.serviceType || 'REDIRECT')
          .limit(1)
          .get();

        if (!routeQuery.empty) {
          matchedRouteDoc = routeQuery.docs[0];
          routeId = matchedRouteDoc.id;
        }
      }

      if (matchedRouteDoc && weightNum > 0) {
        const routeData = matchedRouteDoc.data();
        const available = (routeData.capacity || 0) - (routeData.reserved || 0);
        if (available < weightNum) {
          return res.status(400).json({
            error: `Capacidade insuficiente na rota. Disponível: ${available} kg`
          });
        }

        await db.collection('routes').doc(matchedRouteDoc.id).update({
          reserved: FieldValue.increment(weightNum)
        });
      }

      const shipmentData: any = {
        trackingCode,
        status: body.status || 'REGISTERED',
        origin: body.origin,
        destination: body.destination,
        route,
        routeId,
        senderName: body.senderName,
        senderContact: body.senderContact || '',
        senderPhone: body.senderPhone || '',
        receiverName: body.receiverName,
        receiverContact: body.receiverContact || '',
        receiverPhone: body.receiverPhone || '',
        weight: weightNum,
        category: body.category || '',
        freightValue: body.freightValue ? parseFloat(body.freightValue) : 0,
        price: body.price ? parseFloat(body.price) : 0,
        paymentStatus: body.paymentStatus || 'PENDING',
        description: body.description || '',
        serviceType: body.serviceType || 'REDIRECT',
        cttCode: body.cttCode || '',
        cttLink: body.cttLink || '',
        createdAt: FieldValue.serverTimestamp(),
        history: [{
          status: body.status || 'REGISTERED',
          location: body.origin,
          description: 'Encomenda registada pela equipa',
          timestamp: new Date().toISOString()
        }]
      };

      if (user?.id) {
        shipmentData.userId = user.id;
      }

      const docRef = await db.collection('shipments').add(shipmentData);

      await db.collection('shipments').doc(docRef.id).collection('trackingUpdates').add({
        status: body.status || 'REGISTERED',
        location: body.origin,
        description: 'Encomenda registada pela equipa',
        timestamp: FieldValue.serverTimestamp()
      });

      const clientUser = await AdminController.tryRegisterClient(body, docRef.id, trackingCode);

      if (body.status === 'READY_FOR_PICKUP') {
        const now = new Date();
        const deadline = addBusinessDays(now, 5);
        const isLuanda = isLuandaDestination(body.destination || '');
        const locType: LocationType = isLuanda ? 'luanda' : 'lisbon';

        await db.collection('shipments').doc(docRef.id).update({
          readyForPickupAt: FieldValue.serverTimestamp(),
          pickupDeadline: deadline,
          pickupAddress: isLuanda
            ? 'Morro Bento\nAvenida 21 de Janeiro\nDefronte ao Hotel Ágatha\nNo lado oposto ao Hotel Ágatha\nNa entrada à esquerda da farmácia Elvice, antes do Colégio GAB 2 está a Arisa Express'
            : 'Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros',
          pickupContact: isLuanda ? '+244 948 440 920' : '+351 934 292 082',
          pickupSchedule: isLuanda
            ? 'Segunda a sexta-feira\n08:00 a 12:00\n13:00 a 17:00\nEncerrados aos finais de semana e feriados'
            : 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00'
        });

      }

      const notifyEmail = body.receiverContact || body.senderContact || clientUser?.email;
      if (notifyEmail && notifyEmail.includes('@')) {
        try {
          await sendEmail({
            to: notifyEmail,
            subject: ` Encomenda Registada - ${trackingCode}`,
            template: 'shipment-created',
            data: {
              name: body.receiverName || body.senderName || 'Cliente',
              trackingCode,
              origin: body.origin,
              destination: body.destination,
              senderName: body.senderName,
              receiverName: body.receiverName,
              weight: parseFloat(body.weight) || 0,
              serviceType: body.serviceType || 'REDIRECT',
              price: parseFloat(body.price) || 0
            }
          });
        } catch (emailError: any) {
          logger.error('Erro ao enviar email de notificação de encomenda criada:', emailError);
        }
      }

      res.status(201).json({ success: true, data: { id: docRef.id, ...shipmentData } });
      invalidateCache('admin:stats');
    } catch (error: any) {
      logger.error('Erro ao criar encomenda (admin):', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao criar encomenda' });
    }
  },

  updateCtt: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { cttCode, cttLink } = req.body;

      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = doc.data() as any;
      const updateData: any = {};
      if (cttCode !== undefined) updateData.cttCode = cttCode;
      if (cttLink !== undefined) updateData.cttLink = cttLink;

      await db.collection('shipments').doc(id).update(updateData);
      invalidateCache('admin:stats');

      const contactEmail = shipment.receiverContact || shipment.senderContact;
      if (contactEmail && contactEmail.includes('@')) {
        try {
          await sendEmail({
            to: contactEmail,
            subject: `📦 Atualização CTT - Encomenda ${shipment.trackingCode}`,
            template: 'shipment-ctt-updated',
            data: {
              name: shipment.receiverName || shipment.senderName || 'Cliente',
              trackingCode: shipment.trackingCode,
              cttCode: cttCode || shipment.cttCode || '',
              cttLink: cttLink || shipment.cttLink || ''
            }
          });
        } catch (emailError: any) {
          logger.error('Erro ao enviar email de notificação CTT:', emailError);
        }
      }

      res.json({ success: true, message: 'CTT atualizado com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar CTT:', error);
      res.status(500).json({ error: 'Erro ao atualizar CTT' });
    }
  },

  getShipmentDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await db.collection('shipments').doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const trackingSnapshot = await db.collection('shipments').doc(id)
        .collection('trackingUpdates')
        .orderBy('timestamp', 'desc')
        .get();

      const trackingUpdates = trackingSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const statusCalculado = doc.data()?.status_proprio ?? doc.data()?.status ?? null;
      res.json({
        success: true,
        data: fixEncodingObject({ id: doc.id, ...doc.data(), status_calculado: statusCalculado, trackingUpdates })
      });
    } catch (error) {
      logger.error('Erro ao buscar detalhes da encomenda:', error);
      res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
  },

  getReadyForPickup: async (req: Request, res: Response) => {
    try {
      let snapshot;
      try {
        snapshot = await db.collection('shipments')
          .where('status', '==', 'READY_FOR_PICKUP')
          .orderBy('readyForPickupAt', 'desc')
          .get();
      } catch (indexErr: any) {
        if (indexErr?.message && indexErr.message.includes('requires an index')) {
          snapshot = await db.collection('shipments').where('status', '==', 'READY_FOR_PICKUP').get();
        } else {
          throw indexErr;
        }
      }

      const shipments = snapshot.docs.map(doc => {
        const data = doc.data();
        const now = new Date();
        const deadline = data.pickupDeadline ? new Date(data.pickupDeadline.toDate ? data.pickupDeadline.toDate() : data.pickupDeadline) : null;
        const locationType = guessLocationType(data.destination);
        const isLuanda = locationType === 'luanda';
        const fine = deadline
          ? (isLuanda ? calculateLocationFine(data.price || 0, data.destination || '') : calculateFine(deadline, now))
          : (isLuanda ? calculateLocationFine(data.price || 0, data.destination || '') : 0);

        return {
          id: doc.id,
          ...data,
          calculatedFine: fine,
          daysUntilDeadline: deadline ? getBusinessDaysBetween(now, deadline) : 0
        };
      });

      res.json({ success: true, data: shipments });
    } catch (error) {
      logger.error('Erro ao buscar encomendas para levantamento:', error);
      res.status(500).json({ error: 'Erro ao buscar encomendas' });
    }
  },

  generateWhatsAppLink: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = doc.data() as any;

      if (shipment.status !== 'READY_FOR_PICKUP') {
        return res.status(400).json({ error: 'Encomenda não está disponível para levantamento' });
      }

      const phone = shipment.receiverPhone || shipment.senderPhone || '';
      if (!phone) {
        return res.status(400).json({ error: 'Telefone do destinatário não definido' });
      }

      const readyDate = shipment.readyForPickupAt ? new Date(shipment.readyForPickupAt.toDate ? shipment.readyForPickupAt.toDate() : shipment.readyForPickupAt) : new Date();
      const deadline = shipment.pickupDeadline ? new Date(shipment.pickupDeadline.toDate ? shipment.pickupDeadline.toDate() : shipment.pickupDeadline) : addBusinessDays(readyDate, 5);

      const locationType = guessLocationType(shipment.destination);

      const message = generateWhatsAppMessage({
        trackingCode: shipment.trackingCode,
        shipmentDate: formatDate(readyDate),
        deadline: formatDate(deadline),
        senderName: shipment.senderName || 'N/A',
        receiverName: shipment.receiverName || 'N/A',
        phone,
        pickupAddress: shipment.pickupAddress,
        pickupContact: shipment.pickupContact,
        pickupSchedule: shipment.pickupSchedule,
        price: shipment.price,
        destination: shipment.destination
      });

      const link = generateWhatsAppLink(
        phone,
        message,
        locationType
      );

      const imageUrl = getPickupImage(locationType);
      const isLuanda = imageUrl && imageUrl.includes('Luanda.jpeg');
      const imgName = isLuanda ? 'Luanda.jpeg' : 'Lisboa.jpeg';

      // DESATIVADO: WhatsApp Cloud API não configurada
      // const whatsappResult = await WhatsAppService.sendPickupNotification({
      //   phone,
      //   trackingCode: shipment.trackingCode,
      //   shipmentDate: formatDate(readyDate),
      //   deadline: formatDate(deadline),
      //   senderName: shipment.senderName || 'N/A',
      //   receiverName: shipment.receiverName || 'N/A',
      //   pickupAddress: shipment.pickupAddress || '',
      //   pickupContact: shipment.pickupContact || '',
      //   pickupSchedule: shipment.pickupSchedule || '',
      //   location: getLocationType(shipment.destination || ''),
      //   destination: shipment.destination || ''
      // });

      // if (whatsappResult.sent && whatsappResult.messageId) {
      //   await db.collection('shipments').doc(id).update({
      //     whatsapp_message_id: whatsappResult.messageId,
      //     whatsapp_status: 'sent',
      //     whatsapp_sent_at: FieldValue.serverTimestamp()
      //   });
      //   invalidateCache('admin:stats');
      // }

      logger.info('WhatsApp notification processed for ' + shipment.trackingCode + ' (link mode)');
      res.json({
        success: true,
        data: {
          message,
          link,
          sent: false,
          phone,
          trackingCode: shipment.trackingCode,
          imageUrl,
          imageName: imgName,
          error: null
        }
      });
    } catch (error) {
      logger.error('Erro ao gerar notificação WhatsApp:', error);
      res.status(500).json({ error: 'Erro ao gerar notificação' });
    }
  },
  

  calculateShipmentFine: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = doc.data() as any;

      if (!shipment.pickupDeadline) {
        return res.json({
          success: true,
          data: {
            hasDeadline: false,
            fine: 0,
            message: 'Sem prazo limite definido'
          }
        });
      }

      const deadline = new Date(shipment.pickupDeadline.toDate ? shipment.pickupDeadline.toDate() : shipment.pickupDeadline);
      const now = new Date();
      const locationType = guessLocationType(shipment.destination);
      const isLuanda = locationType === 'luanda';
      const fine = isLuanda
        ? calculateLocationFine(shipment.price || 0, shipment.destination || '')
        : calculateFine(deadline, now);
      const weeksOverdue = isLuanda ? 0 : calculateWeeksOverdue(deadline, now);

      res.json({
        success: true,
        data: {
          hasDeadline: true,
          deadline: formatDate(deadline),
          currentDate: formatDate(now),
          weeksOverdue,
          fine,
          currency: 'EUR'
        }
      });
    } catch (error) {
      logger.error('Erro ao calcular multa:', error);
      res.status(500).json({ error: 'Erro ao calcular multa' });
    }
  },

  updateShipmentStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, location, description } = req.body;

      const shipmentDoc = await db.collection('shipments').doc(id).get();
      if (!shipmentDoc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = shipmentDoc.data() as any;
      const trackingCode = shipment.trackingCode;

      const updateData: any = {
        status,
        currentLocation: location || shipment.destination,
        history: FieldValue.arrayUnion({
          status,
          location: location || shipment.destination,
          description: description || `Status atualizado para ${status}`,
          timestamp: new Date().toISOString()
        })
      };

      if (status === 'DELIVERED') {
        updateData.actualDelivery = FieldValue.serverTimestamp();
      }

      if (status === 'READY_FOR_PICKUP') {
        const now = new Date();
        const deadline = addBusinessDays(now, 5);
        const isLuanda = String(shipment.destination || '').toLowerCase().includes('luanda') || String(shipment.destination || '').toLowerCase().includes('angola');

        updateData.readyForPickupAt = FieldValue.serverTimestamp();
        updateData.pickupDeadline = deadline;
        updateData.pickupAddress = isLuanda
          ? 'Morro Bento\nAvenida 21 de Janeiro\nDefronte ao Hotel Ágatha\nNo lado oposto ao Hotel Ágatha\nNa entrada à esquerda da farmácia Elvice, antes do Colégio GAB 2 está a Arisa Express'
          : 'Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros';
        updateData.pickupContact = isLuanda ? '+244 948 440 920' : '+351 934 292 082';
        updateData.pickupSchedule = isLuanda
          ? 'Segunda à sexta-feira\n08:00 – 12:00\n13:00 – 17:00\nEncerrados aos finais de semana e feriados'
          : 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00';
      }

      if (status === 'PICKED_UP') {
        updateData.pickedUpAt = FieldValue.serverTimestamp();
        updateData.pickupDeadline = null;
      }

      await db.collection('shipments').doc(id).update(updateData);

      await db.collection('shipments').doc(id).collection('trackingUpdates').add({
        status,
        location: location || shipment.destination,
        description: description || `Status atualizado para ${status}`,
        timestamp: FieldValue.serverTimestamp()
      });

      if (CONCLUSIVE_STATUSES.includes(status)) {
        await db.collection('shipments').doc(id).update({
          status_proprio: status,
          is_custom_status: true
        });
        logger.info(`[UpdateStatus] Shipment ${id} set to conclusive status: ${status} (status_proprio=true, is_custom_status=true)`);
      } else {
        logger.info(`[UpdateStatus] Shipment ${id} status updated to: ${status} (inherited - no status_proprio)`);
      }

      if (status === 'READY_FOR_PICKUP') {
        const pickupPhone = (shipment.receiverPhone || shipment.senderPhone || '').replace(/\D/g, '');
        if (pickupPhone.length >= 9) {
          // DESATIVADO: SMS service não configurado
          // const smsService = getSmsNotificationService();
          // const readyDate = new Date();
          // const deadline = addBusinessDays(readyDate, 5);
          // const enqueued = smsService.enqueuePickupNotification({
          //   shipmentId: id,
          //   trackingCode: shipment.trackingCode,
          //   phone: pickupPhone,
          //   data: {
          //     readyDate: formatDate(readyDate),
          //     deadline: formatDate(deadline),
          //     senderName: shipment.senderName || 'N/A',
          //     receiverName: shipment.receiverName || 'N/A',
          //     pickupAddress: updateData.pickupAddress || '',
          //     pickupContact: updateData.pickupContact || '',
          //     pickupSchedule: updateData.pickupSchedule || '',
          //     destination: shipment.destination || ''
          //   }
          // });
          // logger.info(`[SMS] Enqueue result for ${shipment.trackingCode}: ${enqueued ? 'queued' : 'skipped (invalid phone)'}`);
        } else {
          logger.warn(`[SMS] Skipped for shipment ${shipment.trackingCode}: no valid phone (receiverPhone=${shipment.receiverPhone || 'null'}, senderPhone=${shipment.senderPhone || 'null'})`);
        }
      }

      if (shipment.userId) {
        const userDoc = await db.collection('users').doc(shipment.userId).get();
        if (userDoc.exists) {
          const user = userDoc.data() as any;
          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: ` Atualização da Encomenda ${trackingCode}`,
              template: 'shipment-updated',
              data: {
                name: user.name || 'Cliente',
                trackingCode,
                status,
                location: location || shipment.destination,
                description: description || `Status atualizado para ${status}`
              }
            });
          }
        }
      }

      res.json({ success: true, message: 'Status atualizado com sucesso' });
      invalidateCache('admin:stats');
    } catch (error) {
      logger.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  },

  batchUpdateStatus: async (req: Request, res: Response) => {
    try {
      const { route, currentStatus, status, location, description } = req.body
      let q = db.collection("shipments").where("route", "==", route)
      if (currentStatus) { q = q.where("status", "==", currentStatus) }
      const snap = await q.get()
      if (snap.empty) {
        logger.info(`[BatchStatus] No shipments found for route "${route}" with status ${currentStatus || 'any'}`)
        return res.json({ success: true, updated: 0, message: "No shipments found" })
      }
      const batch = db.batch()
      const ids = []
      let notifCount = 0
      let skipped = 0
      for (const doc of snap.docs) {
        const s = doc.data()
        if (!s) continue
        if (s.status_proprio) {
          skipped++
          logger.info(`[BatchStatus] Skipping shipment ${doc.id} (trackingCode: ${s.trackingCode || 'N/A'}) - has status_proprio: ${s.status_proprio}`)
          continue
        }
        const upd: any = {
          status,
          currentLocation: location || s.destination,
          history: FieldValue.arrayUnion({ status, location: location || s.destination, description: description || ("Updated to " + status), timestamp: new Date().toISOString() })
        }
        if (CONCLUSIVE_STATUSES.includes(status)) { upd.status_proprio = status; upd.is_custom_status = true }
        if (status === "DELIVERED") { upd.actualDelivery = FieldValue.serverTimestamp() }
        if (status === "READY_FOR_PICKUP") {
          const deadline = addBusinessDays(new Date(), 5)
          const dest = String(s.destination || "").toLowerCase()
          const isLuanda = dest.includes("luanda") ? true : dest.includes("angola")
          upd.readyForPickupAt = FieldValue.serverTimestamp()
          upd.pickupDeadline = deadline
          upd.pickupAddress = isLuanda ? "Morro Bento" : "Centro Comercial Flamingos"
          upd.pickupContact = isLuanda ? "+244 948 440 920" : "+351 934 292 082"
        }
        if (status === "PICKED_UP") { upd.pickedUpAt = FieldValue.serverTimestamp(); upd.pickupDeadline = null }
        batch.update(doc.ref, upd)
        batch.set(db.collection("shipments").doc(doc.id).collection("trackingUpdates").doc(), { status, location: location || s.destination, description: description || ("Updated to " + status), timestamp: FieldValue.serverTimestamp() })
        ids.push(doc.id)
        if (status === "READY_FOR_PICKUP") {
          const phone = s.receiverPhone || s.senderPhone
          if (phone) {
            notifCount++
            // DESATIVADO: SMS service não configurado
            // const smsService = getSmsNotificationService();
            // const cleanPhone = phone.replace(/\D/g, '')
            // if (cleanPhone.length >= 9) {
            //   const readyDate = new Date();
            //   const deadline = addBusinessDays(readyDate, 5);
            //   const enqueued = smsService.enqueuePickupNotification({
            //     shipmentId: doc.id,
            //     trackingCode: s.trackingCode || "",
            //     phone: cleanPhone,
            //     data: {
            //       readyDate: formatDate(readyDate),
            //       deadline: formatDate(deadline),
            //       senderName: s.senderName || "N/A",
            //       receiverName: s.receiverName || "N/A",
            //       pickupAddress: upd.pickupAddress || "",
            //       pickupContact: upd.pickupContact || "",
            //       pickupSchedule: "",
            //       destination: s.destination || ""
            //     }
            //   });
            //   logger.info(`[SMS] Batch enqueue result for ${s.trackingCode}: ${enqueued ? 'queued' : 'skipped'}`);
            // } else {
            //   logger.warn(`[SMS] Batch skipped for ${s.trackingCode}: invalid phone after cleaning`);
            // }
          } else {
            logger.warn(`[SMS] Batch skipped for ${s.trackingCode}: no phone in shipment`);
          }
        }
      }
      await batch.commit()
      invalidateCache('admin:stats');
      logger.info(`[BatchStatus] Route "${route}" → ${status} | ${ids.length} updated | ${skipped} skipped (individual) | ${notifCount} whatsapp-ready`)
      res.json({ success: true, updated: ids.length, skipped: skipped, message: ids.length + " shipments updated", shipmentIds: ids, whatsappReady: notifCount })
    } catch (error) {
      logger.error("Batch error:", error)
      res.status(500).json({ error: "Batch error" })
    }
  },

  batchUpdateByIds: async (req: Request, res: Response) => {
    try {
      const { ids, status, location, description } = req.body;
      const batch = db.batch();
      const updatedIds = [];
      let notifCount = 0;
      for (const id of ids) {
        const ref = db.collection("shipments").doc(id);
        const snap = await ref.get();
        if (!snap.exists) continue;
        const s: any = snap.data();
        const upd: any = {
          status,
          currentLocation: location || s.destination,
          history: FieldValue.arrayUnion({ status, location: location || s.destination, description: description || ("Updated to " + status), timestamp: new Date().toISOString() })
        }
        if (CONCLUSIVE_STATUSES.includes(status)) { upd.status_proprio = status; upd.is_custom_status = true }
        if (status === "DELIVERED") { upd.actualDelivery = FieldValue.serverTimestamp() }
        if (status === "READY_FOR_PICKUP") {
          upd.readyForPickupAt = FieldValue.serverTimestamp();
          upd.pickupDeadline = addBusinessDays(new Date(), 5);
          const dest = String(s.destination || "").toLowerCase();
          const isLuanda = dest.includes("luanda") ? true : dest.includes("angola");
          upd.pickupAddress = isLuanda ? "Morro Bento" : "Centro Comercial Flamingos";
          upd.pickupContact = isLuanda ? "+244 948 440 920" : "+351 934 292 082";
        }
        if (status === "PICKED_UP") { upd.pickedUpAt = FieldValue.serverTimestamp(); upd.pickupDeadline = null }
        batch.update(ref, upd);
        batch.set(db.collection("shipments").doc(id).collection("trackingUpdates").doc(), { status, location: location || s.destination, description: description || ("Updated to " + status), timestamp: FieldValue.serverTimestamp() });
        updatedIds.push(id);
        if (status === "READY_FOR_PICKUP" && (s.receiverPhone || s.senderPhone)) {
          notifCount++
          // DESATIVADO: SMS service não configurado
          // const smsService = getSmsNotificationService();
          // const phone = (s.receiverPhone || s.senderPhone || "").replace(/\D/g, "")
          // if (phone.length >= 9) {
          //   const readyDate = new Date();
          //   const enqueued = smsService.enqueuePickupNotification({
          //     shipmentId: id,
          //     trackingCode: s.trackingCode || "",
          //     phone: phone,
          //     data: {
          //       readyDate: formatDate(readyDate),
          //       deadline: formatDate(addBusinessDays(readyDate, 5)),
          //       senderName: s.senderName || "N/A",
          //       receiverName: s.receiverName || "N/A",
          //       pickupAddress: upd.pickupAddress || "",
          //       pickupContact: upd.pickupContact || "",
          //       pickupSchedule: "",
          //       destination: s.destination || ""
          //     }
          //   });
          //   logger.info(`[SMS] BatchByIds enqueue result for ${s.trackingCode}: ${enqueued ? 'queued' : 'skipped'}`);
          // } else {
          //   logger.warn(`[SMS] BatchByIds skipped for ${s.trackingCode}: invalid phone after cleaning`);
          // }
        }
      }
      await batch.commit();
      invalidateCache('admin:stats');
      res.json({ success: true, updated: updatedIds.length, message: updatedIds.length + " encomendas atualizadas", shipmentIds: updatedIds, whatsappReady: notifCount });
    } catch (error) { logger.error("Batch by IDs error:", error); res.status(500).json({ error: "Batch error" }) }
  },

  getAllUsers: async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const cursor = req.query.cursor as string | undefined;

      let query = db.collection('users').orderBy('createdAt', 'desc').limit(limit);

      if (cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
          const cursorDoc = await db.collection('users').doc(decoded.id).get();
          if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
          }
        } catch {
          // ignore invalid cursor
        }
      }

      const snapshot = await query.get();
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const nextCursor = lastDoc
        ? Buffer.from(JSON.stringify({ id: lastDoc.id, createdAt: lastDoc.data().createdAt?.toMillis?.() || Date.now() })).toString('base64')
        : null;

      const totalSnapshot = await db.collection('users').count().get();

      res.json({
        success: true,
        data: users,
        pagination: {
          total: totalSnapshot.data().count,
          limit,
          hasMore: snapshot.size === limit,
          nextCursor
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar utilizadores:', error);
      res.status(500).json({ error: 'Erro ao buscar utilizadores' });
    }
  },

  changeUserRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['ADMIN', 'OPERATOR', 'CLIENT'].includes(role)) {
        return res.status(400).json({ error: 'Role inválida' });
      }

      const userDoc = await db.collection('users').doc(id).get();
      const previousRole = userDoc.exists ? userDoc.data()?.role : null;

      await db.collection('users').doc(id).update({ role });
      invalidateCache('admin:stats');
      res.json({ success: true, message: 'Permissões atualizadas' });
    } catch (error) {
      logger.error('Erro ao alterar role:', error);
      res.status(500).json({ error: 'Erro ao alterar permissões' });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const userDoc = await db.collection('users').doc(id).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Utilizador não encontrado' });
      }

      await db.collection('users').doc(id).delete();
      invalidateCache('admin:stats');
      res.json({ success: true, message: 'Utilizador removido' });
    } catch (error) {
      logger.error('Erro ao remover utilizador:', error);
      res.status(500).json({ error: 'Erro ao remover utilizador' });
    }
  },

  getLeads: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('leads')
        .orderBy('createdAt', 'desc')
        .get();

      const leads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      res.json({ success: true, data: leads });
    } catch (error) {
      logger.error('Erro ao buscar leads:', error);
      res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
  },

  markLeadAsRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const leadDoc = await db.collection('leads').doc(id).get();
      if (!leadDoc.exists) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      await db.collection('leads').doc(id).update({
        read: true,
        readAt: FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao marcar lead como lida:', error);
      res.status(500).json({ error: 'Erro ao atualizar mensagem' });
    }
  },

  deleteLead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const leadDoc = await db.collection('leads').doc(id).get();
      if (!leadDoc.exists) {
        return res.status(404).json({ error: 'Mensagem n�o encontrada' });
      }

      await db.collection('leads').doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao eliminar lead:', error);
      res.status(500).json({ error: 'Erro ao eliminar mensagem' });
    }
  },

  getTrends: async (req: Request, res: Response) => {
    try {
      const cached = getCached<any>('admin:trends');
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }

      const now = new Date();
      const months: { label: string; count: number; revenue: number }[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const label = d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
        
        const snapshot = await db.collection('shipments')
          .where('createdAt', '>=', d)
          .where('createdAt', '<', next)
          .get();
        
        let revenue = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          revenue += parseFloat(data.price) || 0;
        });
        
        months.push({ label, count: snapshot.size, revenue });
      }

      setCache('admin:trends', months, 60000);
      res.json({ success: true, data: months });
    } catch (error) {
      logger.error('Erro ao buscar tendências:', error);
      res.status(500).json({ error: 'Erro ao buscar tendências' });
    }
  },

  generateWhatsAppPaymentLink: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = doc.data() as any;

      if (shipment.status !== 'READY_FOR_PICKUP') {
        return res.status(400).json({ error: 'Encomenda não está disponível para levantamento' });
      }

      const phone = shipment.receiverPhone || shipment.senderPhone || '';
      if (!phone) {
        return res.status(400).json({ error: 'Telefone do destinatário não definido' });
      }

      const locationType = guessLocationType(shipment.destination);
      const isLuanda = locationType === 'luanda';

      const readyDate = shipment.readyForPickupAt
        ? new Date(shipment.readyForPickupAt.toDate ? shipment.readyForPickupAt.toDate() : shipment.readyForPickupAt)
        : new Date();

      const weekLater = new Date(readyDate);
      weekLater.setDate(weekLater.getDate() + 7);
      const now = new Date();

      if (now < weekLater) {
        return res.status(400).json({
          error: 'Pagamento só disponível após 7 dias da notificação de levantamento',
          available: false,
          readyDate: formatDate(readyDate),
          availableFrom: formatDate(weekLater)
        });
      }

      const deadline = shipment.pickupDeadline
        ? new Date(shipment.pickupDeadline.toDate ? shipment.pickupDeadline.toDate() : shipment.pickupDeadline)
        : addBusinessDays(readyDate, 5);

      let fine = 0;
      if (isLuanda) {
        fine = calculateLocationFine(shipment.price || 0, shipment.destination || '');
      } else {
        fine = calculateFine(deadline, now);
      }
      const total = (shipment.price || 0) + fine;

      let paymentInfo = '';
      if (fine > 0) {
        if (isLuanda) {
          paymentInfo = `💰 VALOR TOTAL A PAGAR:\n- Multa por atraso: € ${fine.toFixed(2)} (10% do valor do envio)\n- Total: € ${total.toFixed(2)}`;
        } else {
          const weeksOverdue = calculateWeeksOverdue(deadline, now);
          paymentInfo = `💰 VALOR TOTAL A PAGAR:\n- Multa por atraso: € ${fine.toFixed(2)} (${weeksOverdue} semana(s) após o prazo)\n- Total: € ${total.toFixed(2)}`;
        }
      } else {
        paymentInfo = `💰 PAGAMENTO NO ATO DO LEVANTAMENTO:\n- Taxa alfandegária: sob consulta`;
      }

      const message = `ARISA EXPRESS - Encomenda Disponível para Levantamento!

A sua encomenda chegou a ${isLuanda ? 'Angola' : 'Lisboa'} e já está disponível para levantamento!

📦 Nº de Encomenda: ${shipment.trackingCode}
📅 Data de Envio: ${formatDate(readyDate)}
⏰ Prazo Limite: ${formatDate(deadline)} (5 dias úteis)

${paymentInfo}

📋 DOCUMENTOS NECESSÁRIOS:
- Bilhete de identidade (original)
- Fatura/comprovativo de compra (se aplicável)

📍 Local: ${isLuanda ? 'Morro Bento, Avenida 21 de Janeiro, Defronte ao Hotel Ágatha' : 'Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros'}
📞 Contacto: ${isLuanda ? '+244 948 440 920' : '+351 934 292 082'}
🕐 Horário: ${isLuanda ? 'Segunda a sexta-feira | 08:00-12:00 | 13:00-17:00' : 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00'}

Aviso: O não levantamento no prazo de 5 dias úteis implica cobrança de taxa de ocupação de espaço.

Atenciosamente,
Equipa Arisa Express`;

      const defaultCountry = isLuanda ? 'ao' : 'pt';
      const link = generateCustomWhatsAppLink(phone, message, defaultCountry);

      if (!link) {
        return res.status(400).json({ error: 'Número de telefone inválido' });
      }

      res.json({
        success: true,
        data: {
          link,
          phone: formatPhoneToE164(phone, defaultCountry),
          message,
          available: true,
          fine,
          total
        }
      });
    } catch (error: any) {
      logger.error('Erro ao gerar link WhatsApp de pagamento:', error.message);
      res.status(500).json({ error: 'Erro ao gerar link' });
    }
  }
};
