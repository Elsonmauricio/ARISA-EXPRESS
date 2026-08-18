// backend/src/controllers/exportController.ts
import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { getPickupImage, getLocationType } from '../utils/whatsapp';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  COLLECTED: 'Recolhido',
  IN_TRANSIT: 'Em Trânsito',
  CUSTOMS: 'Alfândega',
  IN_PORTUGAL: 'Em Portugal',
  IN_ANGOLA: 'Em Angola',
  OUT_FOR_DELIVERY: 'Saiu Entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelada',
  REGISTERED: 'Registada',
  SHIPPED: 'Enviada',
  READY_FOR_PICKUP: 'Disponível Levantamento',
  PICKED_UP: 'Levantada',
  HUB_DESTINO: 'Chegou Hub Destino'
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago'
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  CLIENT: 'Cliente'
};

const STAGE_LABELS: Record<string, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Qualificado',
  PROPOSAL: 'Proposta',
  WON: 'Convertido',
  LOST: 'Perdido'
};

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: Record<string, any>[]): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    const values = headers.map(h => escapeCsv(row[h]));
    lines.push(values.join(','));
  }
  return lines.join('\n');
}

function formatDate(value: any): string {
  if (!value) return '';
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-PT');
  } catch {
    return '';
  }
}

export const ExportController = {
  exportShipments: async (_req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('shipments').orderBy('createdAt', 'desc').get();
      const rows = snapshot.docs.map(doc => {
        const data = doc.data();
        const status = data.status || '';
        const statusProprio = data.status_proprio || '';
        const statusLabel = statusProprio ? STATUS_LABELS[statusProprio] || statusProprio : STATUS_LABELS[status] || status;
        const dest = data.destination || '';
        const imageUrl = getPickupImage(getLocationType(dest));
        return {
          id: doc.id,
          trackingCode: data.trackingCode || '',
          status: statusLabel,
          origem: data.origin || '',
          destino: dest,
          rota: data.route || '',
          remetente: data.senderName || '',
          destinatario: data.receiverName || '',
          peso: data.weight || 0,
          preco: data.price || 0,
          estadoPagamento: PAYMENT_LABELS[data.paymentStatus] || data.paymentStatus || '',
          dataCriacao: formatDate(data.createdAt),
          disponivelLevantamento: formatDate(data.readyForPickupAt),
          prazoLimite: formatDate(data.pickupDeadline),
          imagemLevantamento: imageUrl
        };
      });

      const headers = ['id','codigoRastreio','status','origem','destino','rota','remetente','destinatario','peso','preco','estadoPagamento','dataCriacao','disponivelLevantamento','prazoLimite','imagemLevantamento'];
      const csv = toCsv(headers, rows);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="encomendas_${new Date().toISOString().slice(0,10)}.csv"`);
      res.send('\uFEFF' + csv);
      logger.info(`Exported ${rows.length} shipments`);
    } catch (error) {
      logger.error('Erro ao exportar encomendas:', error);
      res.status(500).json({ error: 'Erro ao exportar encomendas' });
    }
  },

  exportUsers: async (_req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('users').get();
      const rows = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.name || '',
          email: data.email || '',
          telefone: data.phone || '',
          empresa: data.company || '',
          funcao: ROLE_LABELS[data.role] || data.role || '',
          dataCriacao: formatDate(data.createdAt),
          totalEncomendas: data.shipmentCount || 0
        };
      });

      const headers = ['id','nome','email','telefone','empresa','funcao','dataCriacao','totalEncomendas'];
      const csv = toCsv(headers, rows);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="utilizadores_${new Date().toISOString().slice(0,10)}.csv"`);
      res.send('\uFEFF' + csv);
      logger.info(`Exported ${rows.length} users`);
    } catch (error) {
      logger.error('Erro ao exportar utilizadores:', error);
      res.status(500).json({ error: 'Erro ao exportar utilizadores' });
    }
  },

  exportLeads: async (_req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('leads').orderBy('createdAt', 'desc').get();
      const rows = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.name || '',
          email: data.email || '',
          telefone: data.phone || '',
          mensagem: (data.message || '').replace(/\n/g, ' '),
          estagio: STAGE_LABELS[data.stage] || data.stage || '',
          lida: data.read ? 'Sim' : 'Não',
          atribuidoA: data.assignedToName || '',
          dataCriacao: formatDate(data.createdAt)
        };
      });

      const headers = ['id','nome','email','telefone','mensagem','estagio','lida','atribuidoA','dataCriacao'];
      const csv = toCsv(headers, rows);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="mensagens_${new Date().toISOString().slice(0,10)}.csv"`);
      res.send('\uFEFF' + csv);
      logger.info(`Exported ${rows.length} leads`);
    } catch (error) {
      logger.error('Erro ao exportar leads:', error);
      res.status(500).json({ error: 'Erro ao exportar leads' });
    }
  },

  fullBackup: async (_req: Request, res: Response) => {
    try {
      const [shipmentsSnap, usersSnap, leadsSnap, routesSnap] = await Promise.all([
        db.collection('shipments').get(),
        db.collection('users').get(),
        db.collection('leads').get(),
        db.collection('routes').get()
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        shipments: shipmentsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        leads: leadsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        routes: routesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      };

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="backup_${new Date().toISOString().slice(0,10)}.json"`);
      res.send(JSON.stringify(backup, null, 2));
      logger.info(`Full backup exported: ${backup.shipments.length} shipments, ${backup.users.length} users, ${backup.leads.length} leads, ${backup.routes.length} routes`);
    } catch (error) {
      logger.error('Erro ao gerar backup:', error);
      res.status(500).json({ error: 'Erro ao gerar backup' });
    }
  }
};
