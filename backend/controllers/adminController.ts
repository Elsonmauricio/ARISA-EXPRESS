// backend/src/controllers/adminController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '../services/emailService';
import { logger } from '../utils/logger';
import { addBusinessDays, calculateFine, formatDate, getBusinessDaysBetween, calculateWeeksOverdue } from '../utils/businessDays';
import { generateWhatsAppLink, generateWhatsAppMessage, getLocationType, isLuandaDestination } from '../utils/whatsapp';
import { fixEncodingObject } from '../utils/encoding';
import { LocationType } from '../utils/whatsapp';

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
      const [totalShipments, activeShipments, totalUsers] = await Promise.all([
        db.collection('shipments').count().get(),
        db.collection('shipments').where('status', '!=', 'DELIVERED').count().get(),
        db.collection('users').count().get()
      ]);

      res.json({
        success: true,
        data: {
          totalShipments: totalShipments.data().count,
          activeShipments: activeShipments.data().count,
          totalUsers: totalUsers.data().count
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  },

  getAllShipments: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('shipments')
        .orderBy('createdAt', 'desc')
        .get();

      const shipments = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });

      res.json({ success: true, data: fixEncodingObject(shipments) });
    } catch (error) {
      logger.error('Erro ao buscar encomendas:', error);
      res.status(500).json({ error: 'Erro ao buscar encomendas' });
    }
  },

  searchShipments: async (req: Request, res: Response) => {
    try {
      const { q, status } = req.query;
      let query: any = db.collection('shipments');

      if (status && status !== 'all') {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      let shipments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      if (q && typeof q === 'string') {
        const term = q.toLowerCase();
        shipments = shipments.filter((s: any) =>
          (s.trackingCode || '').toLowerCase().includes(term) ||
          (s.senderName || '').toLowerCase().includes(term) ||
          (s.receiverName || '').toLowerCase().includes(term)
        );
      }

      shipments.sort((a: any, b: any) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.toDate?.()?.getTime?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.toDate?.()?.getTime?.() ?? 0;
        return tb - ta;
      });

      res.json({ success: true, data: shipments });
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
      const route = body.route || `${body.origin} » ${body.destination}`;

      const shipmentData: any = {
        trackingCode,
        status: body.status || 'REGISTERED',
        origin: body.origin,
        destination: body.destination,
        route,
        senderName: body.senderName,
        senderContact: body.senderContact || '',
        senderPhone: body.senderPhone || '',
        receiverName: body.receiverName,
        receiverContact: body.receiverContact || '',
        receiverPhone: body.receiverPhone || '',
        weight: parseFloat(body.weight) || 0,
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

       await AdminController.tryRegisterClient(body, docRef.id, trackingCode);

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

      res.status(201).json({ success: true, data: { id: docRef.id, ...shipmentData } });
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

      const updateData: any = {};
      if (cttCode !== undefined) updateData.cttCode = cttCode;
      if (cttLink !== undefined) updateData.cttLink = cttLink;

      await db.collection('shipments').doc(id).update(updateData);
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

      res.json({
        success: true,
        data: fixEncodingObject({ id: doc.id, ...doc.data(), trackingUpdates })
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
        const fine = deadline ? calculateFine(deadline, now) : 0;

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

      const message = generateWhatsAppMessage({
        trackingCode: shipment.trackingCode,
        shipmentDate: formatDate(readyDate),
        deadline: formatDate(deadline),
        senderName: shipment.senderName || 'N/A',
        receiverName: shipment.receiverName || 'N/A',
        phone,
        pickupAddress: shipment.pickupAddress,
        pickupContact: shipment.pickupContact,
        pickupSchedule: shipment.pickupSchedule
      });

      const link = generateWhatsAppLink(
        phone,
        message,
        getLocationType(shipment.destination || '')
      );

      logger.info('WhatsApp link generated for ' + shipment.trackingCode);
      res.json({
        success: true,
        data: {
          message,
          link,
          sent: false,
          phone,
          trackingCode: shipment.trackingCode
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
      const fine = calculateFine(deadline, now);
      const weeksOverdue = calculateWeeksOverdue(deadline, now);

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
    } catch (error) {
      logger.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  },

  getAllUsers: async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('users').get();
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });

      res.json({ success: true, data: users });
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

      await db.collection('users').doc(id).update({ role });
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
  }
};
