// backend/src/controllers/paymentProofController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';
import { fixEncodingObject } from '../utils/encoding';
import { getPickupImage, guessLocationType } from '../utils/whatsapp';
import { formatDate } from '../utils/businessDays';
import { sendEmail } from '../services/emailService';
import { invalidateCache } from '../middleware/cache';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  VERIFIED: 'Verificado',
  READY_FOR_PICKUP: 'Disponível Levantamento',
  PICKED_UP: 'Levantada',
  DELIVERED: 'Entregue'
};

export const PaymentProofController = {
  uploadPaymentProof: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!user || !user.id) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = doc.data() as any;

      if (shipment.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Ficheiro não enviado. Envie uma imagem (JPG, PNG) ou PDF.' });
      }

      const backendUrl = process.env.BACKEND_URL || '';
      const fileUrl = backendUrl
        ? `${backendUrl.replace(/\/$/, '')}/api/uploads/${req.file.filename}`
        : `/api/uploads/${req.file.filename}`;

      const proofData = {
        paymentProofUrl: fileUrl,
        paymentProofFileName: req.file.filename,
        paymentProofSubmittedAt: FieldValue.serverTimestamp(),
        paymentProofSubmittedBy: user.name || user.email || '',
        paymentStatus: 'PENDING',
        status: shipment.status === 'PENDING' ? 'READY_FOR_PICKUP' : shipment.status,
        updatedAt: FieldValue.serverTimestamp()
      };

      await db.collection('shipments').doc(id).update(proofData);

      await db.collection('shipments').doc(id).collection('trackingUpdates').add({
        status: proofData.status,
        location: shipment.destination || '',
        description: 'Comprovativo de pagamento enviado - aguarda verificação',
        timestamp: FieldValue.serverTimestamp()
      });

      logger.info(`[PaymentProof] Proof uploaded for shipment ${shipment.trackingCode} by ${user.email}`);

      res.json({
        success: true,
        message: 'Comprovativo de pagamento enviado com sucesso. Aguarde a verificação.',
        data: {
          paymentProofUrl: fileUrl,
          status: proofData.status
        }
      });
    } catch (error: any) {
      logger.error('Erro ao enviar comprovativo de pagamento:', error.message);
      res.status(500).json({ error: 'Erro ao enviar comprovativo' });
    }
  },

  getPendingPayments: async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const cursor = req.query.cursor as string | undefined;
      const statusFilter = req.query.status as string | undefined;

      let query: any = db.collection('shipments')
        .where('paymentProofSubmittedAt', '!=', null)
        .where('paymentStatus', '==', 'PENDING');

      if (statusFilter && statusFilter !== 'all') {
        query = query.where('status', '==', statusFilter);
      }

      query = query.orderBy('paymentProofSubmittedAt', 'desc').limit(limit);

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
        const locationType = guessLocationType(data.destination);
        const imageUrl = getPickupImage(locationType);
        const readyDate = data.readyForPickupAt
          ? new Date(data.readyForPickupAt.toDate ? data.readyForPickupAt.toDate() : data.readyForPickupAt)
          : new Date();
        const deadline = data.pickupDeadline
          ? new Date(data.pickupDeadline.toDate ? data.pickupDeadline.toDate() : data.pickupDeadline)
          : null;

        return {
          id: doc.id,
          ...data,
          readyForPickupAt: data.readyForPickupAt?.toDate?.() || data.readyForPickupAt || null,
          pickupDeadline: data.pickupDeadline?.toDate?.() || data.pickupDeadline || null,
          paymentProofUrl: data.paymentProofUrl || '',
          paymentProofFileName: data.paymentProofFileName || '',
          paymentProofSubmittedAt: data.paymentProofSubmittedAt?.toDate?.() || data.paymentProofSubmittedAt || null,
          paymentProofSubmittedBy: data.paymentProofSubmittedBy || '',
          locationType,
          imageUrl,
          readyDateFormatted: readyDate ? formatDate(readyDate) : '',
          deadlineFormatted: deadline ? formatDate(deadline) : ''
        };
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const nextCursor = lastDoc
        ? Buffer.from(JSON.stringify({ id: lastDoc.id })).toString('base64')
        : null;

      res.json({
        success: true,
        data: fixEncodingObject(shipments),
        pagination: {
          limit,
          hasMore: snapshot.size === limit,
          nextCursor
        }
      });
    } catch (error: any) {
      logger.error('Erro ao buscar pagamentos pendentes:', error.message);
      res.status(500).json({ error: 'Erro ao buscar pagamentos pendentes' });
    }
  },

  verifyPayment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status: newStatus, proceedToNextStatus } = req.body;

      const doc = await db.collection('shipments').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Encomenda não encontrada' });
      }

      const shipment = doc.data() as any;

      const updateData: any = {
        paymentStatus: 'PAID',
        paymentVerifiedAt: FieldValue.serverTimestamp(),
        paymentVerifiedBy: (req as any).user?.name || (req as any).user?.email || 'admin',
        updatedAt: FieldValue.serverTimestamp()
      };

      if (proceedToNextStatus) {
        const nextStatus = newStatus || 'IN_TRANSIT';
        updateData.status = nextStatus;
        updateData.currentLocation = shipment.destination;
        updateData.history = FieldValue.arrayUnion({
          status: nextStatus,
          location: shipment.destination || '',
          description: 'Pagamento verificado - encomenda a seguir caminho para o destino',
          timestamp: new Date().toISOString()
        });
        updateData[`${nextStatus.toLowerCase()}At`] = FieldValue.serverTimestamp();

        await db.collection('shipments').doc(id).collection('trackingUpdates').add({
          status: nextStatus,
          location: shipment.destination || '',
          description: 'Pagamento verificado - encomenda a seguir caminho para o destino',
          timestamp: FieldValue.serverTimestamp()
        });
      } else {
        updateData.history = FieldValue.arrayUnion({
          status: 'PAID',
          location: shipment.destination || '',
          description: 'Pagamento verificado com sucesso',
          timestamp: new Date().toISOString()
        });

        await db.collection('shipments').doc(id).collection('trackingUpdates').add({
          status: 'PAID',
          location: shipment.destination || '',
          description: 'Pagamento verificado com sucesso',
          timestamp: FieldValue.serverTimestamp()
        });
      }

      await db.collection('shipments').doc(id).update(updateData);

      if (recipientsValid(shipment)) {
        const recipients = Array.from(
          new Set(
            [shipment.receiverContact, shipment.senderContact].filter(
              (email): email is string => Boolean(email) && email.includes('@')
            )
          )
        );
        if (recipients.length > 0) {
          try {
            const locationType = guessLocationType(shipment.destination);
            const imageUrl = getPickupImage(locationType);
            await Promise.allSettled(
              recipients.map(to =>
                sendEmail({
                  to,
                  subject: `✅ Pagamento Confirmado - Encomenda ${shipment.trackingCode}`,
                  template: 'shipment-updated',
                  data: {
                    name: shipment.receiverName || shipment.senderName || 'Cliente',
                    trackingCode: shipment.trackingCode,
                    status: proceedToNextStatus ? newStatus : 'PAID',
                    location: shipment.destination || '',
                    description: proceedToNextStatus
                      ? 'Pagamento verificado - encomenda a seguir caminho para o destino'
                      : 'Pagamento verificado com sucesso'
                  }
                })
              )
            );
          } catch (emailError: any) {
            logger.error(`[PaymentProof] Erro ao enviar email de confirmação:`, emailError);
          }
        }
      }

      invalidateCache('admin:stats');
      logger.info(`[PaymentProof] Payment verified for shipment ${shipment.trackingCode}`);

      res.json({
        success: true,
        message: 'Pagamento verificado com sucesso. A encomenda continua o seu caminho.',
        data: {
          paymentStatus: 'PAID',
          status: proceedToNextStatus ? newStatus : shipment.status,
          paymentProofUrl: shipment.paymentProofUrl || ''
        }
      });
    } catch (error: any) {
      logger.error('Erro ao verificar pagamento:', error.message);
      res.status(500).json({ error: 'Erro ao verificar pagamento' });
    }
  }
};

function recipientsValid(shipment: any): boolean {
  return Boolean(shipment.receiverContact || shipment.senderContact);
}