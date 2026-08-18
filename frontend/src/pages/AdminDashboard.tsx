// src/pages/AdminDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Package, Truck, Users, TrendingUp,
  AlertCircle, CheckCircle2, Clock, XCircle,
  Search, Plus, Edit, Trash2, MapPin,
  ChevronDown, ChevronRight, RefreshCw, Mail,
  Tag, UserPlus, StickyNote, Filter, Send, Download
} from 'lucide-react';
import { GoldButton } from '../components/Button';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/LanguageContext';
import { api, authenticatedFetch, logout } from '../lib/api';
import { openWhatsAppLink } from '../lib/whatsapp';

// ======================== UTILITÁRIOS ========================
function formatDateSafe(value: any, fallback = '—'): string {
  if (!value) return fallback;
  const date = typeof value === 'object' && value.toDate ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('pt-PT');
}

// ======================== TIPOS ========================
interface Shipment {
  id: string;
  trackingCode: string;
  origin: string;
  destination: string;
  weight: number;
  price: number;
  status: string;
  status_proprio?: string | null;
  status_calculado?: string;
  is_custom_status?: boolean;
  routeId?: string;
  route?: string;
  createdAt: any;
  senderName: string;
  receiverName: string;
  userId: string;
  readyForPickupAt?: any;
  pickupDeadline?: any;
  calculatedFine?: number;
  daysUntilDeadline?: number;
  receiverPhone?: string;
  cttCode?: string;
  cttLink?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'CLIENT';
  phone?: string;
  company?: string;
  createdAt: string;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
  pricePerKg: number;
  flightDate: string;
  serviceType: string;
  capacity: number;
  reserved: number;
  available: number;
  status: string;
  status_atual?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: any;
  read: boolean;
  stage?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  tags?: string[];
  notes?: any[];
}

const LEAD_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'] as const;
type LeadStage = typeof LEAD_STAGES[number];

const STAGE_LABELS: Record<LeadStage | string, string> = {
  NEW: 'admin.novo',
  CONTACTED: 'admin.contactado',
  QUALIFIED: 'admin.qualificado',
  PROPOSAL: 'admin.proposta',
  WON: 'admin.convertido',
  LOST: 'admin.perdido'
};

const STAGE_COLORS: Record<LeadStage | string, string> = {
  NEW: 'text-blue-400 bg-blue-400/10',
  CONTACTED: 'text-lilac-400 bg-lilac-400/10',
  QUALIFIED: 'text-orange-400 bg-orange-400/10',
  PROPOSAL: 'text-cyan-400 bg-cyan-400/10',
  WON: 'text-green-400 bg-green-400/10',
  LOST: 'text-red-400 bg-red-400/10'
};

// ======================== FUNÇÃO AUXILIAR PARA FORMATAR DATAS ========================
function formatDate(dateValue: any): string {
  if (!dateValue) return '—';
  try {
    if (typeof dateValue === 'object' && dateValue.toDate) {
      return dateValue.toDate().toLocaleDateString('pt-PT');
    }
    if (typeof dateValue === 'string') {
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-PT');
    }
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString('pt-PT');
    }
    return '—';
  } catch {
    return '—';
  }
}

// ======================== STATS CARDS ========================
function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  const isUp = change >= 0;
  return (
    <div className={`flex items-center gap-0.5 text-[10px] font-medium mt-1 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
      {isUp ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      <span className="text-gray-400 font-normal">vs mês anterior</span>
    </div>
  );
}

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8 mt-2">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${color} opacity-80 hover:opacity-100 transition-opacity`}
          title={`${v}`}
        />
      ))}
    </div>
  );
}

function StatsCards({ stats, trends }: { stats: any; trends: any[] }) {
  const { t } = useT();
  const trendCounts = trends.map(t => t.count);
  const trendRevenue = trends.map(t => t.revenue);

  const cards = [
    { label: t('admin.statTotal'), value: stats.totalShipments || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', trend: trendCounts, trendColor: 'bg-blue-500', comparison: stats.previousMonthShipments },
    { label: t('admin.statTransito'), value: stats.inTransitShipments || 0, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', trend: trendCounts, trendColor: 'bg-purple-500' },
    { label: t('admin.statPendentes'), value: stats.pendingShipments || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', trend: trendCounts, trendColor: 'bg-amber-500' },
    { label: t('admin.statLevantamento'), value: stats.readyForPickupShipments || 0, icon: AlertCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', trend: trendCounts, trendColor: 'bg-emerald-500' },
    { label: t('admin.statCanceladas'), value: stats.cancelledShipments || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', trend: trendCounts, trendColor: 'bg-red-500' },
    { label: t('admin.statUsers'), value: stats.totalUsers || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', trend: trendCounts, trendColor: 'bg-indigo-500' },
    { label: t('admin.statMensagens'), value: stats.newLeads || 0, icon: Mail, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', trend: trendCounts, trendColor: 'bg-cyan-500' },
    { label: t('admin.statReceita'), value: `€ ${(stats.totalShipments * 150).toFixed(0)}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', trend: trendRevenue, trendColor: 'bg-green-500', isCurrency: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className={`${card.bg} border ${card.border} rounded-xl p-4 hover:shadow-md transition-shadow`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</p>
              {card.comparison !== undefined && <TrendIndicator current={parseInt(card.value) || 0} previous={card.comparison} />}
            </div>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
          {card.trend && <MiniBarChart data={card.trend} color={card.trendColor} />}
        </div>
      ))}
    </div>
  );
}

// ======================== ALERTS SECTION ========================
function AlertsSection({ stats, revenue }: { stats: any; revenue: any }) {
  const { t } = useT();
  const alerts = [];
  if (stats.readyForPickupShipments > 0) {
    alerts.push({ key: 'levantamento', label: t('admin.levantamentoPendente'), value: stats.readyForPickupShipments, color: 'emerald', icon: Package });
  }
  if (revenue.pending > 0) {
    alerts.push({ key: 'pagamento', label: t('admin.pagamentosPendentes'), value: `€ ${revenue.pending.toFixed(2)}`, color: 'yellow', icon: Clock });
  }
  if (stats.newLeads > 0) {
    alerts.push({ key: 'mensagens', label: t('admin.novasMensagens'), value: stats.newLeads, color: 'cyan', icon: Mail });
  }
  if (stats.pendingShipments > 0) {
    alerts.push({ key: 'pendentes', label: t('admin.statPendentes'), value: stats.pendingShipments, color: 'orange', icon: AlertCircle });
  }

  if (alerts.length === 0) {
    return (
      <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl mb-8">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-sm sm:text-base">{t('admin.atencao')}</h3>
        </div>
        <p className="text-sm text-gray-600">{t('admin.semAtencao')}</p>
      </div>
    );
  }

  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  };

  return (
    <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl mb-8">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-gold" />
        <h3 className="font-semibold text-sm sm:text-base">{t('admin.atencao')}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {alerts.map((alert) => {
          const c = colorMap[alert.color];
          return (
            <div key={alert.key} className={`flex items-center gap-3 p-3 rounded-xl border ${c.border} ${c.bg}`}>
              <alert.icon className={`w-5 h-5 ${c.text} flex-shrink-0`} />
              <div className="min-w-0">
                <div className="text-xs text-gray-600 truncate">{alert.label}</div>
                <div className={`text-sm font-bold ${c.text}`}>{alert.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================== FINANCIAL OVERVIEW ========================
function FinancialOverview({ revenue }: { revenue: any }) {
  const { t } = useT();
  const total = revenue.thisMonth || 1;
  const paidPercent = total > 0 ? Math.round((revenue.paid / total) * 100) : 0;
  const pendingPercent = total > 0 ? Math.round((revenue.pending / total) * 100) : 0;

  return (
    <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl mb-8">
      <h3 className="font-semibold mb-4 text-sm sm:text-base">{t('admin.faturamento')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="p-3 rounded-xl bg-green-400/5 border border-green-400/10">
          <div className="text-xs text-gray-600">{t('admin.receitaMes')}</div>
          <div className="text-lg sm:text-xl font-bold text-green-400">€ {revenue.thisMonth.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/10">
          <div className="text-xs text-gray-600">{t('admin.receitaPendente')}</div>
          <div className="text-lg sm:text-xl font-bold text-yellow-400">€ {revenue.pending.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{pendingPercent}% do total</div>
        </div>
        <div className="p-3 rounded-xl bg-blue-400/5 border border-blue-400/10">
          <div className="text-xs text-gray-600">{t('admin.receitaPaga')}</div>
          <div className="text-lg sm:text-xl font-bold text-blue-400">€ {revenue.paid.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{paidPercent}% do total</div>
        </div>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
        <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${paidPercent}%` }} />
        <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${pendingPercent}%` }} />
      </div>
    </div>
  );
}

// ======================== RECENT SHIPMENTS ========================
function RecentShipments({ shipments, onViewAll }: { shipments: Shipment[]; onViewAll: () => void }) {
  const { t } = useT();
  const getStatusBadge = (s: Shipment) => {
    if (s.is_custom_status && s.status_proprio) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-green-500/20 text-green-400">{t(`status.${s.status_proprio || s.status}`)}</span>;
    }
    const colors: Record<string, string> = {
      PENDING: 'text-yellow-400 bg-yellow-400/10',
      COLLECTED: 'text-blue-400 bg-blue-400/10',
      IN_TRANSIT: 'text-lilac-400 bg-lilac-400/10',
      CUSTOMS: 'text-orange-400 bg-orange-400/10',
      IN_PORTUGAL: 'text-cyan-400 bg-cyan-400/10',
      IN_ANGOLA: 'text-emerald-400 bg-emerald-400/10',
      OUT_FOR_DELIVERY: 'text-purple-400 bg-purple-400/10',
      DELIVERED: 'text-green-400 bg-green-400/10',
      CANCELLED: 'text-red-400 bg-red-400/10',
      REGISTERED: 'text-gray-400 bg-gray-400/10',
      SHIPPED: 'text-blue-400 bg-blue-400/10',
      READY_FOR_PICKUP: 'text-emerald-300 bg-emerald-300/10',
      PICKED_UP: 'text-gray-400 bg-gray-400/10'
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${colors[s.status] || 'text-gray-600 bg-white'}`}>{t(`status.${s.status}`)}</span>;
  };

  return (
    <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl mb-6">
      <h3 className="font-semibold mb-4 text-sm sm:text-base">{t('admin.ultimasEncomendas')}</h3>
      <div className="space-y-3">
        {shipments.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('admin.nenhumaRecente')}</p>
        ) : (
          shipments.map((s) => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-gold">{s.trackingCode}</span>
                  {getStatusBadge(s)}
                </div>
                <div className="text-xs text-gray-600 mt-1">{s.origin} → {s.destination}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{s.senderName} → {s.receiverName}</div>
              </div>
              <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                <div className="text-xs font-semibold text-gray-800">€ {s.price?.toFixed(2) || '—'}</div>
                <div className="text-[10px] text-gray-400">{formatDate(s.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <button onClick={onViewAll} className="mt-4 text-xs text-gold hover:underline">
        {t('admin.verDetalhes')} →
      </button>
    </div>
  );
}

// ======================== STATUS DISTRIBUTION ========================
function StatusDistribution({ distribution }: { distribution: Record<string, number> }) {
  const { t } = useT();
  const entries = Object.entries(distribution).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-400', text: 'text-yellow-400' },
    COLLECTED: { bg: 'bg-blue-400', text: 'text-blue-400' },
    IN_TRANSIT: { bg: 'bg-lilac-400', text: 'text-lilac-400' },
    CUSTOMS: { bg: 'bg-orange-400', text: 'text-orange-400' },
    IN_PORTUGAL: { bg: 'bg-cyan-400', text: 'text-cyan-400' },
    IN_ANGOLA: { bg: 'bg-emerald-400', text: 'text-emerald-400' },
    OUT_FOR_DELIVERY: { bg: 'bg-purple-400', text: 'text-purple-400' },
    DELIVERED: { bg: 'bg-green-400', text: 'text-green-400' },
    CANCELLED: { bg: 'bg-red-400', text: 'text-red-400' },
    REGISTERED: { bg: 'bg-gray-400', text: 'text-gray-400' },
    SHIPPED: { bg: 'bg-blue-400', text: 'text-blue-400' },
    READY_FOR_PICKUP: { bg: 'bg-emerald-300', text: 'text-emerald-300' },
    PICKED_UP: { bg: 'bg-gray-400', text: 'text-gray-400' }
  };

  return (
    <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
      <h3 className="font-semibold mb-4 text-sm sm:text-base">{t('admin.distribuicao')}</h3>
      {entries.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('admin.nenhumaEncomenda2')}</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([status, count]) => {
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const colors = statusColors[status] || { bg: 'bg-gray-400', text: 'text-gray-400' };
            return (
              <div key={status}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm text-gray-600">{t(`status.${status}`)}</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800">{count} ({percent}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${colors.bg} transition-all duration-500`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ======================== EXPORT BUTTONS ========================
function ExportButtons() {
  const { t } = useT();
  const token = localStorage.getItem('token');

  const download = async (endpoint: string, filename: string) => {
    if (!token) return;
    try {
      const response = await authenticatedFetch(api(endpoint), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(t('admin.erroConexao'));
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button onClick={() => download('/api/admin/export/shipments', `shipments_${new Date().toISOString().slice(0,10)}.csv`)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-2">
        <Download className="w-4 h-4" /> {t('admin.exportarEncomendas')}
      </button>
      <button onClick={() => download('/api/admin/export/users', `users_${new Date().toISOString().slice(0,10)}.csv`)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-2">
        <Download className="w-4 h-4" /> {t('admin.exportarUtilizadores')}
      </button>
      <button onClick={() => download('/api/admin/export/leads', `leads_${new Date().toISOString().slice(0,10)}.csv`)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-2">
        <Download className="w-4 h-4" /> {t('admin.exportarMensagens')}
      </button>
      <button onClick={() => download('/api/admin/backup/full', `backup_${new Date().toISOString().slice(0,10)}.json`)} className="px-4 py-2 bg-[#4B2170] text-white rounded-lg text-sm hover:bg-[#7B2FBF] transition-colors flex items-center gap-2">
        <Download className="w-4 h-4" /> {t('admin.backupCompleto')}
      </button>
    </div>
  );
}

// ======================== NOVA ENCOMENDA (ADMIN) ========================
function NewShipmentForm() {
  const [form, setForm] = useState({
    origin: 'Lisboa',
    destination: 'Luanda',
    route: 'Lisboa » Luanda',
    senderName: '',
    senderContact: '',
    senderPhone: '',
    receiverName: '',
    receiverContact: '',
    receiverPhone: '',
    weight: '',
    category: '',
    freightValue: '',
    price: '',
    paymentStatus: 'PENDING',
    status: 'REGISTERED',
    description: '',
    cttCode: '',
    cttLink: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        ...form,
        weight: parseFloat(form.weight) || 0,
        freightValue: form.freightValue ? parseFloat(form.freightValue) : 0,
        price: form.price ? parseFloat(form.price) : 0,
        cttLink: form.cttLink || ''
      };

      const response = await authenticatedFetch(api('/api/admin/shipments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      if (json.success) {
        setSuccess(t('admin.encomendaCriada'));
        setForm({
          origin: 'Lisboa', destination: 'Luanda', route: 'Lisboa » Luanda',
          senderName: '', senderContact: '', senderPhone: '',
          receiverName: '', receiverContact: '', receiverPhone: '',
          weight: '', category: '', freightValue: '', price: '',
          paymentStatus: 'PENDING', status: 'REGISTERED',
          description: '', cttCode: '', cttLink: ''
        });
      } else {
        setError(json.error || t('admin.erroCriarEncomenda'));
      }
    } catch (err) {
      setError(t('admin.erroConexao'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
      <h3 className="font-semibold mb-4 text-sm sm:text-base">{t('admin.novaEncomenda')}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.origem')}</label>
            <select value={form.origin} onChange={e => setForm({...form, origin: e.target.value, route: `${e.target.value} » ${form.destination}`})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none">
              <option value="Lisboa">Lisboa</option>
              <option value="Luanda">Luanda</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.destino')}</label>
            <select value={form.destination} onChange={e => setForm({...form, destination: e.target.value, route: `${form.origin} » ${e.target.value}`})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none">
              <option value="Lisboa">Lisboa</option>
              <option value="Luanda">Luanda</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.status')}</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none">
              <option value="REGISTERED">{t('status.REGISTERED')}</option>
              <option value="SHIPPED">{t('status.SHIPPED')}</option>
              <option value="IN_CUSTOMS">{t('status.IN_CUSTOMS')}</option>
              <option value="READY_FOR_PICKUP">{t('status.READY_FOR_PICKUP')}</option>
              <option value="PICKED_UP">{t('status.PICKED_UP')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.pesoKg')}</label>
            <input type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.remetente')}</label>
            <input type="text" value={form.senderName} onChange={e => setForm({...form, senderName: e.target.value})} required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('ship.remetenteTel')}</label>
            <input type="tel" value={form.senderPhone} onChange={e => setForm({...form, senderPhone: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('ship.destinatario')}</label>
            <input type="text" value={form.receiverName} onChange={e => setForm({...form, receiverName: e.target.value})} required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('ship.destinatarioTel')}</label>
            <input type="tel" value={form.receiverPhone} onChange={e => setForm({...form, receiverPhone: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.categoria')}</label>
            <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder={t('admin.categoriaPlaceholder')} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.valorFrete')}</label>
            <input type="number" value={form.freightValue} onChange={e => setForm({...form, freightValue: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.preco')}</label>
            <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.estadoFinanceiro')}</label>
            <select value={form.paymentStatus} onChange={e => setForm({...form, paymentStatus: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none">
              <option value="PENDING">{t('admin.pendente')}</option>
              <option value="PAID">{t('admin.pago')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.codigoCtt')}</label>
            <input type="text" value={form.cttCode} onChange={e => setForm({...form, cttCode: e.target.value})} placeholder={t('admin.cttExemplo')} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t('admin.linkCtt')}</label>
            <input type="url" value={form.cttLink} onChange={e => setForm({...form, cttLink: e.target.value})} placeholder="https://www.ctt.pt/..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('ship.descricao')}</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-gold outline-none resize-none" />
        </div>

        {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
        {success && <div className="text-green-400 text-sm bg-green-500/10 p-3 rounded-lg">{success}</div>}

        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gold text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
          {loading ? t('admin.aProcessar') : t('admin.registarEncomenda')}
        </button>
      </form>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'text-yellow-400 bg-yellow-400/10',
    COLLECTED: 'text-blue-400 bg-blue-400/10',
    IN_TRANSIT: 'text-lilac-400 bg-lilac-400/10',
    CUSTOMS: 'text-orange-400 bg-orange-400/10',
    IN_PORTUGAL: 'text-cyan-400 bg-cyan-400/10',
    IN_ANGOLA: 'text-emerald-400 bg-emerald-400/10',
    OUT_FOR_DELIVERY: 'text-purple-400 bg-purple-400/10',
    DELIVERED: 'text-green-400 bg-green-400/10',
    CANCELLED: 'text-red-400 bg-red-400/10',
    REGISTERED: 'text-gray-400 bg-gray-400/10',
    SHIPPED: 'text-blue-400 bg-blue-400/10',
    IN_CUSTOMS: 'text-orange-400 bg-orange-400/10',
    READY_FOR_PICKUP: 'text-cyan-400 bg-cyan-400/10',
    PICKED_UP: 'text-green-400 bg-green-400/10'
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

// ======================== ADMIN SHIPMENT LIST ========================
function AdminShipmentList({ refreshKey }: { refreshKey?: number }) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pageLimit] = useState(20);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchRoute, setBatchRoute] = useState('')
  const [batchStatus, setBatchStatus] = useState('')
  const [batchUpdating, setBatchUpdating] = useState(false)
  const [selectedShipments, setSelectedShipments] = useState<string[]>([])
  const [batchCurrentStatus, setBatchCurrentStatus] = useState("")
  const [batchWhatsappInfo, setBatchWhatsappInfo] = useState<{count: number; links: string[]} | null>(null)
  const [editingCttId, setEditingCttId] = useState<string | null>(null);
  const [cttForm, setCttForm] = useState<Record<string, { code: string; link: string }>>({});
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { t } = useT();

  const [routes, setRoutes] = useState<Route[]>([]);

  const authenticatedFetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api('/api/routes'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) return;
      const json = await response.json();
      if (json.success) setRoutes(json.data);
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    authenticatedFetchRoutes();
  }, [refreshKey]);

  const authenticatedFetchShipments = useCallback(async (cursor?: string | null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setRefreshing(true);
      setShipments([]);
      setNextCursor(null);
      setHasMore(false);
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('admin.naoAutenticado'));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let endpoint = '/api/admin/shipments';
      const params = new URLSearchParams();
      params.set('limit', String(pageLimit));
      if (cursor) params.set('cursor', cursor);
      if (filter && filter !== 'all') params.set('status', filter);

      if (search.trim()) {
        endpoint = '/api/admin/shipments/search';
        params.set('q', search.trim());
      }

      const response = await authenticatedFetch(api(`${endpoint}?${params.toString()}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        setShipments(prev => cursor ? [...prev, ...json.data] : json.data);
        setNextCursor(json.pagination?.nextCursor || null);
        setHasMore(!!json.pagination?.hasMore);
        setError('');
      } else {
        setError(json.error || t('admin.erroEncomendas'));
      }
    } catch (err) {
      setError(t('admin.erroConexao'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter, search, pageLimit, t, navigate, api]);

  useEffect(() => {
    authenticatedFetchShipments();
  }, [authenticatedFetchShipments, refreshKey, filter]);

  const loadMore = () => {
    if (!loadingMore && nextCursor) {
      authenticatedFetchShipments(nextCursor);
    }
  };

  const refreshShipments = () => {
    authenticatedFetchShipments();
  };

  useEffect(() => {
    authenticatedFetchShipments();
  }, [authenticatedFetchShipments, refreshKey]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/admin/shipments/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, location: 'Luanda', description: t('admin.statusAtualizado', { status }) })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        authenticatedFetchShipments();
      }
    } catch (err) {
      alert(t('admin.erroStatus'));
    }
  };

  const batchUpdateRoute = async () => {
    try {
      setBatchUpdating(true)
      const token = localStorage.getItem('token')
      const response = await authenticatedFetch(api('/api/admin/shipments/batch-status'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          route: batchRoute,
          currentStatus: batchCurrentStatus || undefined,
          status: batchStatus
        })
      })
      const json = await response.json()
      if (json.success) {
        if (json.whatsappReady > 0) {
          setBatchWhatsappInfo({ count: json.whatsappReady, links: json.shipmentIds.map((id: string) => `${window.location.origin}/admin/track/${id}`) })
        } else {
          setBatchWhatsappInfo(null)
        }
        alert(json.message + (json.whatsappReady > 0 ? '. ' + json.whatsappReady + ' encomendas prontas para WhatsApp.' : ''))
        authenticatedFetchShipments()
        setBatchModalOpen(false)
      } else {
        alert(json.error || 'Erro ao atualizar')
      }
    } catch (err) {
      alert('Erro ao atualizar encomendas')
    } finally {
      setBatchUpdating(false)
    }
  }

  const batchUpdateSelected = async () => {
    if (!batchStatus || selectedShipments.length === 0) return
    try {
      setBatchUpdating(true)
      const token = localStorage.getItem('token')
      const response = await authenticatedFetch(api('/api/admin/shipments/batch-status-by-ids'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          ids: selectedShipments,
          status: batchStatus
        })
      })
      const json = await response.json()
      if (json.success) {
        if (json.whatsappReady > 0) {
          setBatchWhatsappInfo({ count: json.whatsappReady, links: json.shipmentIds.map((id: string) => `${window.location.origin}/admin/track/${id}`) })
        } else {
          setBatchWhatsappInfo(null)
        }
        alert(json.message + (json.whatsappReady > 0 ? '. ' + json.whatsappReady + ' encomendas prontas para WhatsApp.' : ''))
        authenticatedFetchShipments()
        setSelectedShipments([])
        setBatchStatus('')
      } else {
        alert(json.error || 'Erro ao atualizar')
      }
    } catch (err) {
      alert('Erro ao atualizar encomendas')
    } finally {
      setBatchUpdating(false)
    }
  }


  
  const sendWhatsApp = async (shipment: Shipment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/admin/shipments/${shipment.id}/whatsapp-link`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (json.success && json.data?.link) {
        const imageUrl = json.data.imageUrl;
        const isLuanda = imageUrl && imageUrl.includes('Luanda.jpeg');
        const imgName = isLuanda ? 'Luanda.jpeg' : 'Lisboa.jpeg';
        alert('Link do WhatsApp aberto. Imagem para este envio: ' + imgName + '\nURL da imagem: ' + imageUrl);
        window.open(json.data.link, '_blank');
      } else {
        alert(json.error || t('admin.erroWhatsapp'));
      }
    } catch {
      alert(t('admin.erroWhatsapp'));
    }
  };

  const sendPaymentWhatsApp = async (shipment: Shipment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/admin/shipments/${shipment.id}/whatsapp-payment`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (json.success && json.data?.link) {
        openWhatsAppLink(json.data.link);
      } else {
        alert(json.error || t('admin.erroWhatsapp'));
      }
    } catch {
      alert(t('admin.erroWhatsapp'));
    }
  };

  const updateCtt = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const form = cttForm[id] || { code: '', link: '' };
      const response = await authenticatedFetch(api(`/api/admin/shipments/${id}/ctt`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cttCode: form.code, cttLink: form.link })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        setEditingCttId(null);
        setCttForm(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        authenticatedFetchShipments();
      } else {
        alert(json.error || t('admin.erroWhatsapp'));
      }
    } catch (err) {
      alert(t('admin.erroWhatsapp'));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'text-yellow-400 bg-yellow-400/10',
      COLLECTED: 'text-blue-400 bg-blue-400/10',
      IN_TRANSIT: 'text-lilac-400 bg-lilac-400/10',
      CUSTOMS: 'text-orange-400 bg-orange-400/10',
      IN_PORTUGAL: 'text-cyan-400 bg-cyan-400/10',
      IN_ANGOLA: 'text-emerald-400 bg-emerald-400/10',
      OUT_FOR_DELIVERY: 'text-purple-400 bg-purple-400/10',
      DELIVERED: 'text-green-400 bg-green-400/10',
      CANCELLED: 'text-red-400 bg-red-400/10',
      READY_FOR_PICKUP: 'text-emerald-300 bg-emerald-300/10',
      PICKED_UP: 'text-gray-400 bg-gray-400/10'
    };
    return colors[status] || 'text-gray-600 bg-white';
  };

  const filtered = shipments.filter(s => {
    const matchFilter = filter === 'all' || s.status === filter;
    const matchSearch = s.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
                        s.senderName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="text-center py-8 text-gray-600">{t('admin.aCarregarEncomendas')}</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.pesquisar')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gold text-sm"
            />
          </div>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-[#E8D9F5] border border-gray-300 rounded-lg text-gold text-sm focus:border-gold outline-none"
        >
          <option value="all">{t('admin.todosStatus')}</option>
          <option value="PENDING">{t('status.PENDING')}</option>
          <option value="COLLECTED">{t('status.COLLECTED')}</option>
          <option value="IN_TRANSIT">{t('status.IN_TRANSIT')}</option>
          <option value="CUSTOMS">{t('status.CUSTOMS')}</option>
          <option value="IN_PORTUGAL">{t('status.IN_PORTUGAL')}</option>
          <option value="IN_ANGOLA">{t('status.IN_ANGOLA')}</option>
          <option value="OUT_FOR_DELIVERY">{t('status.OUT_FOR_DELIVERY')}</option>
          <option value="DELIVERED">{t('status.DELIVERED')}</option>
          <option value="CANCELLED">{t('status.CANCELLED')}</option>
          <option value="READY_FOR_PICKUP">{t('status.READY_FOR_PICKUP')}</option>
          <option value="PICKED_UP">{t('status.PICKED_UP')}</option>
        </select>
        <button
          onClick={refreshShipments}
          disabled={refreshing}
          className="px-4 py-2 bg-[#E8D9F5] border border-gray-300 rounded-lg text-gold hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {t('admin.atualizar')}
        </button>
        <button
          onClick={() => setBatchModalOpen(true)}
          className="px-4 py-2 bg-[#4B2170] border border-[#4B2170]/30 rounded-lg text-gray-800 hover:bg-[#7B2FBF] transition-colors flex items-center gap-2">
          Atualizar Rota
        </button>
      </div>

      <div className="overflow-x-auto px-4 sm:px-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-300">
              <tr>
                <th className="py-3 px-2"><input type="checkbox" /></th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.codigo')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">{t('admin.remetente')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.rota')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden md:table-cell">{t('admin.peso')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden lg:table-cell">{t('admin.preco')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden lg:table-cell">{t('admin.prazoLimite')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.valorMulta')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.status')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.acoes')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                 <React.Fragment key={s.id}>
                 <tr className="border-b border-lilac/10 hover:bg-white transition-colors">
                  <td className="py-3 px-2"><input type="checkbox" checked={selectedShipments.includes(s.id)} onChange={(e) => { if (e.target.checked) { setSelectedShipments([...selectedShipments, s.id]); } else { setSelectedShipments(selectedShipments.filter(id => id !== s.id)); } }} /></td><td className="py-3 px-2 sm:px-4 font-mono text-gold text-xs sm:text-sm">{s.trackingCode}</td>
                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">{s.senderName}</td>
                   <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{s.route || `${s.origin} → ${s.destination}`}</td>
                   <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">{s.weight} {t('ship.kg')}</td>
                   <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">€ {s.price?.toFixed(2) || '—'}</td>
                   <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">
                     {formatDateSafe(s.pickupDeadline)}
                   </td>
                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                    {s.calculatedFine !== undefined ? `€ ${s.calculatedFine.toFixed(2)}` : '€—'}
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                     {(() => {
                       if (s.is_custom_status) {
                         return (
                           <span className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-500/20 text-green-400">
                             {t(`status.${s.status_proprio || s.status}`)} <span className="opacity-70">({t('admin.individualAction')})</span>
                           </span>
                         );
                       }
                       const parentRoute = s.routeId
                         ? routes.find(r => r.id === s.routeId)
                         : routes.find(r => `${r.origin} » ${r.destination}` === s.route);
                       const routeStatus = parentRoute?.status_atual || parentRoute?.status;
                       if (routeStatus) {
                         return (
                           <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusColor(routeStatus)}`}>
                             {t(`status.${routeStatus}`)} <span className="opacity-70">(da rota)</span>
                           </span>
                         );
                       }
                       return (
                         <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusColor(s.status)}`}>
                           {t(`status.${s.status}`)}
                         </span>
                       );
                     })()}
                  </td>
                   <td className="py-3 px-2 sm:px-4">
                     <div className="flex flex-wrap items-center gap-1">
                        {s.status === 'READY_FOR_PICKUP' && (
                          <button
                            onClick={() => sendWhatsApp(s)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors text-[10px] sm:text-xs whitespace-nowrap"
                          >
                            <Send className="w-3 h-3" /> {t('admin.enviarWhatsapp')}
                          </button>
                        )}
                         {s.status === 'READY_FOR_PICKUP' && (() => {
                           const readyDate = s.readyForPickupAt
                             ? new Date(
                                 typeof s.readyForPickupAt === 'object' && 'seconds' in s.readyForPickupAt
                                   ? (s.readyForPickupAt as any).seconds * 1000
                                   : s.readyForPickupAt
                               )
                             : null;
                           const paymentAvailable = readyDate
                             ? new Date() >= new Date(readyDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                             : false;
                           return paymentAvailable ? (
                             <button
                               onClick={() => sendPaymentWhatsApp(s)}
                               className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition-colors text-[10px] sm:text-xs whitespace-nowrap"
                             >
                               <Send className="w-3 h-3" /> WhatsApp Pagamento
                             </button>
                           ) : null;
                         })()}
                       <button
                         onClick={() => {
                           setEditingCttId(editingCttId === s.id ? null : s.id);
                           setCttForm(prev => ({
                             ...prev,
                             [s.id]: prev[s.id] || { code: s.cttCode || '', link: s.cttLink || '' }
                           }));
                         }}
                         className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-[10px] sm:text-xs whitespace-nowrap ${
                           editingCttId === s.id
                             ? 'bg-gold/20 text-gold'
                             : 'bg-[#E8D9F5] text-gray-600 hover:bg-white'
                         }`}
                       >
                          <Edit className="w-3 h-3" /> {t('admin.ctt')}
                       </button>
                       <select
                        value={s.status}
                        onChange={(e) => updateStatus(s.id, e.target.value)}
                        className="px-1 sm:px-2 py-1 bg-[#E8D9F5] border border-gray-300 rounded text-[10px] sm:text-xs text-gold focus:border-gold outline-none max-w-[100px]"
                      >
                        <option value="PENDING">{t('status.PENDING')}</option>
                        <option value="COLLECTED">{t('status.COLLECTED')}</option>
                        <option value="IN_TRANSIT">{t('status.IN_TRANSIT')}</option>
                        <option value="CUSTOMS">{t('status.CUSTOMS')}</option>
                        <option value="IN_PORTUGAL">{t('status.IN_PORTUGAL')}</option>
                        <option value="IN_ANGOLA">{t('status.IN_ANGOLA')}</option>
                        <option value="OUT_FOR_DELIVERY">{t('status.OUT_FOR_DELIVERY')}</option>
                        <option value="DELIVERED">{t('status.DELIVERED')}</option>
                        <option value="CANCELLED">{t('status.CANCELLED')}</option>
                        <option value="READY_FOR_PICKUP">{t('status.READY_FOR_PICKUP')}</option>
                        <option value="PICKED_UP">{t('status.PICKED_UP')}</option>
                       </select>
                     </div>
                   </td>
                 </tr>
                 {editingCttId === s.id && (
                   <tr key={`${s.id}-ctt`} className="border-b border-lilac/10 bg-lilac/[0.02]">
                     <td colSpan={10} className="py-3 px-2 sm:px-4">
                       <div className="flex flex-wrap items-center gap-2">
                         <input
                           type="text"
                           placeholder={t('admin.cttCodigo')}
                           value={cttForm[s.id]?.code || ''}
                           onChange={(e) => setCttForm(prev => ({ ...prev, [s.id]: { ...(prev[s.id] || { code: '', link: '' }), code: e.target.value } }))}
                           className="px-2 py-1 bg-[#E8D9F5] border border-gray-300 rounded text-xs text-gold focus:border-gold outline-none min-h-[32px]"
                         />
                         <input
                           type="text"
                           placeholder={t('admin.cttLink')}
                           value={cttForm[s.id]?.link || ''}
                           onChange={(e) => setCttForm(prev => ({ ...prev, [s.id]: { ...(prev[s.id] || { code: '', link: '' }), link: e.target.value } }))}
                           className="px-2 py-1 bg-[#E8D9F5] border border-gray-300 rounded text-xs text-gold focus:border-gold outline-none min-h-[32px] flex-1"
                         />
                         <button
                           onClick={() => updateCtt(s.id)}
                           className="px-3 py-1 bg-gold text-[#374151] rounded text-xs font-medium hover:opacity-90 transition-opacity"
                         >
                           {t('admin.salvarCtt')}
                         </button>
                         <button
                           onClick={() => { setEditingCttId(null); setCttForm(prev => { const next = { ...prev }; delete next[s.id]; return next; }); }}
                           className="px-3 py-1 bg-[#E8D9F5] text-gray-600 rounded text-xs hover:bg-white transition-colors"
                         >
                           {t('admin.cancelar')}
        </button>
        {selectedShipments.length > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gold">{selectedShipments.length} selecionadas</span>
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value)}
              className="px-2 py-1 bg-[#E8D9F5] border border-gray-300 rounded text-xs text-gold focus:border-gold outline-none max-w-[120px]"
            >
              <option value="">Ação...</option>
              <option value="IN_TRANSIT">Em Trânsito</option>
              <option value="IN_PORTUGAL">Chegou Portugal</option>
              <option value="IN_ANGOLA">Chegou Angola</option>
              <option value="OUT_FOR_DELIVERY">Saiu Entrega</option>
              <option value="DELIVERED">Entregue</option>
              <option value="READY_FOR_PICKUP">Disp. Levantamento</option>
              <option value="PICKED_UP">Levantado</option>
            </select>
            <button
              onClick={batchUpdateSelected}
              disabled={batchUpdating || !batchStatus}
              className="px-3 py-1 bg-[#4B2170] text-white rounded text-xs hover:bg-[#7B2FBF] disabled:opacity-50"
            >
              Aplicar
            </button>
            <button
              onClick={() => setSelectedShipments([])}
              className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500"
            >
              Limpar
            </button>
          </div>
        )}
      </div>
                     </td>
                   </tr>
                 )}
               </React.Fragment>
              ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-[#4B2170] text-white rounded-lg hover:bg-[#7B2FBF] disabled:opacity-50 text-sm"
                >
                  {loadingMore ? 'A carregar...' : 'Carregar mais'}
                </button>
              </div>
            )}
          </div>
        </div>
        {loading && shipments.length === 0 && (
          <div className="text-center py-8 text-gray-600">{t('admin.aCarregarEncomendas')}</div>
        )}
        {error && (
          <div className="text-center py-8 text-red-400">{error}</div>
        )}
        {!loading && !error && shipments.length === 0 && (
          <div className="text-center py-8 text-gray-400">{t('admin.nenhumaEncomenda')}</div>
        )}
        {batchModalOpen && (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-bold text-[#4B2170] mb-4">Atualizar Rota</h3>
           <div className="mb-4">
             <label className="block text-sm text-gray-600 mb-1">Estado Atual</label>
             <select
               value={batchCurrentStatus}
               onChange={(e) => setBatchCurrentStatus(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg">
               <option value="">Todas as encomendas</option>
               <option value="IN_TRANSIT">Em Trânsito</option>
               <option value="IN_PORTUGAL">Em Portugal</option>
               <option value="IN_ANGOLA">Em Angola</option>
               <option value="SHIPPED">Enviada</option>
               <option value="CUSTOMS">Na Alfândega</option>
             </select>
             <p className="text-xs text-gray-500 mt-1">Filtrar apenas encomendas neste estado atual</p>
           </div>
           <div className="mb-4">
             <label className="block text-sm text-gray-600 mb-1">Rota</label>

            <input
              type="text"
              value={batchRoute}
              onChange={(e) => setBatchRoute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Lisboa - Luanda" />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Novo Estado</label>
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">:
              <option value="">Selecione...</option>
              <option value="READY_FOR_PICKUP">Dispon. Levantamento</option>
              <option value="IN_TRANSIT">Em Transito</option>
              <option value="IN_PORTUGAL">Chegou Portugal</option>
              <option value="IN_ANGOLA">Chegou Angola</option>
              <option value="OUT_FOR_DELIVERY">Saiu Entrega</option>
              <option value="DELIVERED">Entregue</option>
              <option value="PICKED_UP">Levantado</option>
            </select>
          </div>
           {batchWhatsappInfo && (
             <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
               <p className="text-sm text-emerald-800 font-medium">{batchWhatsappInfo.count} encomendas prontas para notificação WhatsApp</p>
               <p className="text-xs text-emerald-600 mt-1">Clique no botão WhatsApp de cada encomenda na tabela para abrir a conversa.</p>
             </div>
           )}
           <div className="flex gap-3">
            <button
              onClick={(e) => setBatchModalOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
            <button
              onClick={batchUpdateRoute}
              disabled={batchUpdating || !batchRoute}
              className="flex-1 px-4 py-2 bg-[#4B2170] text-white rounded-lg hover:bg-[#7B2FBF] disabled:opacity-50">
              {batchUpdating ? "Atualizando..." : "Atualizar Encomendas " + (batchRoute ? "(" + batchRoute + ")" : "")}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

// ======================== ADMIN USER LIST ========================
function AdminUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();
  const { t } = useT();

  const authenticatedFetchUsers = async (cursor?: string | null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setUsers([]);
      setNextCursor(null);
      setHasMore(false);
    }
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (cursor) params.set('cursor', cursor);

      const response = await authenticatedFetch(api(`/api/admin/users?${params.toString()}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        setUsers(prev => cursor ? [...prev, ...json.data] : json.data);
        setNextCursor(json.pagination?.nextCursor || null);
        setHasMore(!!json.pagination?.hasMore);
      } else {
        setError(json.error || t('admin.erroUsers'));
      }
    } catch (err) {
      setError(t('admin.erroConexao'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    authenticatedFetchUsers();
  }, []);

  const loadMore = () => {
    if (!loadingMore && nextCursor) {
      authenticatedFetchUsers(nextCursor);
    }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/admin/users/${id}/role`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      authenticatedFetchUsers();
    } catch (err) {
      alert(t('admin.erroAlterarRole'));
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-600">{t('admin.aCarregarUsers')}</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  return (
    <div className="overflow-x-auto px-4 sm:px-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-300">
            <tr>
              <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.nome')}</th>
              <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">{t('admin.email')}</th>
              <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden md:table-cell">{t('admin.telefone')}</th>
              <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden lg:table-cell">{t('admin.empresa')}</th>
              <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.role')}</th>
              <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.acoes')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-lilac/10 hover:bg-white transition-colors">
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{u.name}</td>
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">{u.email}</td>
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">{u.phone || '—'}</td>
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">{u.company || '—'}</td>
                <td className="py-3 px-2 sm:px-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                    u.role === 'ADMIN' ? 'text-gold bg-gold/10' :
                    u.role === 'OPERATOR' ? 'text-lilac-400 bg-lilac-400/10' :
                    'text-gray-600 bg-white'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-2 sm:px-4">
                   <select
                     value={u.role}
                     onChange={(e) => changeRole(u.id, e.target.value)}
                     className="px-1 sm:px-2 py-1 bg-[#E8D9F5] border border-gray-300 rounded text-[10px] sm:text-xs text-gold focus:border-gold outline-none min-h-[32px] sm:min-h-[36px]"
                   >
                    <option value="CLIENT">{t('admin.cliente')}</option>
                    <option value="OPERATOR">{t('admin.operador')}</option>
                    <option value="ADMIN">{t('admin.admin')}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <div className="mt-4 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2 bg-[#4B2170] text-white rounded-lg hover:bg-[#7B2FBF] disabled:opacity-50 text-sm"
            >
              {loadingMore ? 'A carregar...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ======================== ADMIN ROUTE MANAGER ========================
function AdminRouteManager({ onRouteStatusChange }: { onRouteStatusChange?: () => void }) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRoute, setNewRoute] = useState({
    origin: '',
    destination: '',
    pricePerKg: 0,
    flightDate: '',
    capacity: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingRouteId, setSavingRouteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useT();

  const authenticatedFetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api('/api/routes'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        setRoutes(json.data);
      } else {
        setError(json.error || t('admin.erroRotas'));
      }
    } catch (err) {
      setError(t('admin.erroConexao'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    authenticatedFetchRoutes();
  }, []);

  const updateRouteStatus = async (id: string, status: string) => {
    try {
      setSavingRouteId(id);
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/routes/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        authenticatedFetchRoutes();
        // Dispara re-busca de encomendas no AdminShipmentList
        onRouteStatusChange?.();
        if (json.data?.whatsappReady > 0) {
          alert(json.data.whatsappReady + ' encomendas prontas para WhatsApp.');
        }
      } else {
        alert(json.error || t('admin.erroStatusRota'));
      }
    } catch (err) {
      alert(t('admin.erroConexao'));
    } finally {
      setSavingRouteId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api('/api/routes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingId || undefined,
          serviceType: 'REDIRECT',
          ...newRoute
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        authenticatedFetchRoutes();
        setNewRoute({ origin: '', destination: '', pricePerKg: 0, flightDate: '', capacity: 0 });
        setEditingId(null);
      } else {
        alert(json.error || t('admin.erroGuardar'));
      }
    } catch (err) {
      alert(t('admin.erroConexao'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmarEliminar'))) return;
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/routes/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      authenticatedFetchRoutes();
    } catch (err) {
      alert(t('admin.erroEliminar'));
    }
  };

  const isExpired = (flightDate: string) => {
    return new Date(flightDate) < new Date();
  };

  if (loading) return <div className="text-center py-8 text-gray-600">{t('admin.aCarregarRotas')}</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  return (
    <div>
      <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl mb-6">
        <h4 className="font-semibold mb-4 text-sm sm:text-base">{editingId ? t('admin.editarRota') : t('admin.adicionarRota')}</h4>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder={t('admin.origem')}
            value={newRoute.origin}
            onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
            required
            className="px-3 py-2 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gold text-sm min-h-[44px]"
          />
          <input
            type="text"
            placeholder={t('admin.destino')}
            value={newRoute.destination}
            onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
            required
            className="px-3 py-2 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gold text-sm min-h-[44px]"
          />
          <input
            type="number"
            placeholder={t('admin.euKg')}
            value={newRoute.pricePerKg || ''}
            onChange={(e) => setNewRoute({ ...newRoute, pricePerKg: parseFloat(e.target.value) || 0 })}
            required
            className="px-3 py-2 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gold text-sm min-h-[44px]"
          />
          <input
            type="date"
            value={newRoute.flightDate}
            onChange={(e) => setNewRoute({ ...newRoute, flightDate: e.target.value })}
            required
            className="px-3 py-2 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gold text-sm min-h-[44px]"
          />
          <input
            type="number"
            placeholder={t('admin.capacidadeKg')}
            value={newRoute.capacity || ''}
            onChange={(e) => setNewRoute({ ...newRoute, capacity: parseFloat(e.target.value) || 0 })}
            required
            className="px-3 py-2 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gold text-sm min-h-[44px]"
          />
          <div className="lg:col-span-6 flex flex-col sm:flex-row gap-2">
            <GoldButton type="submit" className="py-2 px-4 text-black">
              {editingId ? t('admin.atualizar') : t('admin.adicionar')}
            </GoldButton>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setNewRoute({ origin: '', destination: '', pricePerKg: 0, flightDate: '', capacity: 0 }); }}
                className="px-4 py-2 rounded-lg bg-[#E8D9F5] text-gray-600 hover:bg-white text-sm"
                >
                  {t('admin.cancelar')}
                </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-x-auto px-4 sm:px-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-300">
              <tr>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.origem')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.destino')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">{t('admin.servico')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.euKg')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.dataVoo')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden md:table-cell">{t('admin.capacidade')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden lg:table-cell">{t('admin.reservado')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.disponivel')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.statusRota')}</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{t('admin.acoes')}</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => {
                const expired = isExpired(r.flightDate);
                return (
                  <tr key={r.id} className={`border-b border-lilac/10 hover:bg-white transition-colors ${expired ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{r.origin}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{r.destination}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">{t(`admin.${r.serviceType.toLowerCase()}`)}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">€ {r.pricePerKg}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                      {r.flightDate ? new Date(r.flightDate).toLocaleDateString('pt-PT') : '—'}
                      {expired && <span className="ml-2 text-red-400 text-[10px]">{t('admin.expirada')}</span>}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">{r.capacity} {t('ship.kg')}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">{r.reserved} {t('ship.kg')}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">
                      <span className={r.available > 0 ? 'text-green-400' : 'text-red-400'}>
                          {r.available} {t('ship.kg')}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                      <select
                        value={r.status_atual || r.status || 'PROCESSAMENTO'}
                        onChange={(e) => updateRouteStatus(r.id, e.target.value)}
                        disabled={savingRouteId === r.id}
                        className="px-2 py-1 bg-[#E8D9F5] border border-gray-300 rounded text-[10px] sm:text-xs text-gold focus:border-gold outline-none min-h-[32px] sm:min-h-[36px]"
                      >
                        <option value="CARGA_RECEBIDA">{t('admin.cargaRecebida')}</option>
                        <option value="PROCESSAMENTO">{t('admin.processamento')}</option>
                        <option value="TRANSITO_AEREO">{t('admin.transitoAereo')}</option>
                        <option value="DESPACHO">{t('admin.desembarqueAlfandega')}</option>
                        <option value="HUB_DESTINO">{t('admin.chegouHubDestino')}</option>
                        <option value="READY_FOR_PICKUP">{t('admin.disponivelLevantamento')}</option>
                        <option value="ROTA_CONCLUIDA">{t('admin.rotaConcluida')}</option>
                      </select>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingId(r.id);
                            setNewRoute({
                              origin: r.origin,
                              destination: r.destination,
                              pricePerKg: r.pricePerKg,
                              flightDate: r.flightDate ? r.flightDate.split('T')[0] : '',
                              capacity: r.capacity
                            });
                          }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {routes.length === 0 && (
        <div className="text-center py-8 text-gray-400">{t('admin.nenhumaRota')}</div>
      )}
    </div>
  );
}

// ======================== ADMIN LEADS LIST (CRM / MENSAGENS) ========================
function AdminLeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [newNote, setNewNote] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [leadsRefreshing, setLeadsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { t } = useT();

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const authenticatedFetchLeads = async (cursor?: string | null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setLeads([]);
      setNextCursor(null);
      setHasMore(false);
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('admin.naoAutenticado'));
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set('limit', '20');
      if (cursor) params.set('cursor', cursor);
      if (stageFilter !== 'ALL') params.set('stage', stageFilter);

      const response = await authenticatedFetch(api(`/api/admin/leads?${params.toString()}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        setLeads(prev => cursor ? [...prev, ...json.data] : json.data);
        setNextCursor(json.pagination?.nextCursor || null);
        setHasMore(!!json.pagination?.hasMore);
      } else {
        setError(json.error || t('admin.erroMsgs'));
      }
    } catch (err) {
      setError(t('admin.erroConexao'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && nextCursor) {
      authenticatedFetchLeads(nextCursor);
    }
  };

  const authenticatedFetchPipeline = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await authenticatedFetch(api('/api/admin/leads/pipeline'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        setPipeline(json.data || {});
      }
    } catch (err) {
      // pipeline is non-critical
    }
  };

  const refreshAll = async () => {
    setLeadsRefreshing(true);
    setError('');
    await Promise.all([authenticatedFetchLeads(), authenticatedFetchPipeline()]);
    setLeadsRefreshing(false);
  };

  useEffect(() => {
    authenticatedFetchLeads();
  }, [stageFilter]);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/admin/leads/${id}/read`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      authenticatedFetchLeads();
    } catch (err) {
      alert(t('admin.erroMarcarLida'));
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm(t('admin.confirmarEliminarMsg'))) return;
    try {
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/admin/leads/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      authenticatedFetchLeads();
      authenticatedFetchPipeline();
    } catch (err) {
      alert(t('admin.erroEliminarMsg'));
    }
  };

  const changeStage = async (id: string, stage: string) => {
    try {
      setSaving(s => ({ ...s, [id]: true }));
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/admin/leads/${id}/stage`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      await Promise.all([authenticatedFetchLeads(), authenticatedFetchPipeline()]);
    } catch (err) {
      alert(t('admin.erroEstado'));
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  };

  const assignToMe = async (id: string) => {
    try {
      setSaving(s => ({ ...s, [id]: true }));
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/admin/leads/${id}/assign`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedTo: currentUser?.id || null,
          assignedToName: currentUser?.name || null
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      authenticatedFetchLeads();
    } catch (err) {
      alert(t('admin.erroAtribuir'));
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  };

  const addTag = async (id: string) => {
    const tag = (newTag[id] || '').trim();
    if (!tag) return;
    try {
      setSaving(s => ({ ...s, [id]: true }));
      const token = localStorage.getItem('token');
      const current = leads.find(l => l.id === id)?.tags || [];
      if (current.includes(tag)) {
        setNewTag(s => ({ ...s, [id]: '' }));
        return;
      }
      const merged = [...current, tag];
      const response = await authenticatedFetch(api(`/api/admin/leads/${id}/tags`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tags: merged })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setNewTag(s => ({ ...s, [id]: '' }));
      authenticatedFetchLeads();
    } catch (err) {
      alert(t('admin.erroAddEtiqueta'));
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  };

  const addNote = async (id: string) => {
    const text = (newNote[id] || '').trim();
    if (!text) return;
    try {
      setSaving(s => ({ ...s, [id]: true }));
      const token = localStorage.getItem('token');
      const response = await authenticatedFetch(api(`/api/admin/leads/${id}/notes`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setNewNote(s => ({ ...s, [id]: '' }));
      authenticatedFetchLeads();
    } catch (err) {
      alert(t('admin.erroAddNota'));
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  };

  // Função para formatar data/hora
  const formatDateTime = (dateValue: any): string => {
    if (!dateValue) return '—';
    try {
      let d;
      if (typeof dateValue === 'object' && dateValue.toDate) {
        d = dateValue.toDate();
      } else if (typeof dateValue === 'string') {
        d = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        d = dateValue;
      } else {
        return '—';
      }
      if (isNaN(d.getTime())) return '€”';
      return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT');
    } catch {
      return '—';
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-600">{t('admin.aCarregarMsgs')}</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  const filterPills = [
    { key: 'ALL', label: t('admin.todos'), count: leads.length },
    ...LEAD_STAGES.map(stage => ({
      key: stage,
      label: t(STAGE_LABELS[stage]),
      count: pipeline[stage] || 0
    }))
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-gray-400" />
        {filterPills.map((pill) => (
          <button
            key={pill.key}
            onClick={() => setStageFilter(pill.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
              stageFilter === pill.key
                ? 'bg-gold text-[#374151]'
                : 'bg-[#E8D9F5] text-gray-600 hover:bg-white'
            }`}
          >
            {pill.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              stageFilter === pill.key ? 'bg-white text-gray-800' : 'bg-white text-gray-800/70'
            }`}>
              {pill.count}
            </span>
          </button>
        ))}
        <button
          onClick={refreshAll}
          disabled={leadsRefreshing}
          className="ml-auto px-3 py-1.5 bg-[#E8D9F5] border border-gray-300 rounded-lg text-gold hover:bg-white transition-colors flex items-center gap-2 text-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${leadsRefreshing ? 'animate-spin' : ''}`} /> {t('admin.atualizar')}
        </button>
      </div>

      {leads.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
           <p>{t('admin.nenhumaLead')}</p>
        </div>
      )}

      {leads.map((lead) => {
        const stage = lead.stage || 'NEW';
        const notes = lead.notes || [];
        const tags = lead.tags || [];
        const isOpen = notesOpen[lead.id] || false;
        const isSaving = saving[lead.id] || false;
        return (
          <div
            key={lead.id}
            className={`glass-strong border-gradient p-4 rounded-xl transition-all ${
              lead.read ? 'opacity-60' : 'border-gold/50'
            }`}
          >
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="font-semibold text-gold text-sm sm:text-base truncate">{lead.name}</span>
                  <span className="text-sm text-gray-400 hidden sm:inline">—</span>
                  <a href={`mailto:${lead.email}`} className="text-sm text-gold hover:underline truncate">
                    {lead.email}
                  </a>
                  {lead.phone && (
                    <>
                      <span className="text-sm text-gray-400 hidden sm:inline">—</span>
                      <a href={`tel:${lead.phone}`} className="text-sm text-gray-600 hover:text-gold truncate">
                        {lead.phone}
                      </a>
                    </>
                  )}
                  <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                    {formatDateTime(lead.createdAt)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap break-words">{lead.message}</div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${STAGE_COLORS[stage]}`}>
                    {t(STAGE_LABELS[stage])}
                  </span>
                  <select
                    value={stage}
                    disabled={isSaving}
                    onChange={(e) => changeStage(lead.id, e.target.value)}
                    className="px-2 py-1 bg-[#E8D9F5] border border-gray-300 rounded text-[10px] sm:text-xs text-gold focus:border-gold outline-none min-h-[32px] sm:min-h-[36px]"
                  >
                    {LEAD_STAGES.map(s => (
                      <option key={s} value={s}>{t(STAGE_LABELS[s])}</option>
                    ))}
                  </select>
                  {!lead.read && (
                     <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded-full">{t('admin.nova')}</span>
                  )}
                </div>

                <div className="mt-2 text-xs">
                  {lead.assignedToName ? (
                    <span className="text-gray-600 flex items-center gap-1">
                       <UserPlus className="w-3 h-3" /> {t('admin.atribuidoA', { name: lead.assignedToName })}
                    </span>
                  ) : (
                    <button
                      onClick={() => assignToMe(lead.id)}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-2 py-1 bg-lilac-400/20 text-lilac-400 rounded-lg hover:bg-lilac-400/30 transition-colors text-[10px] sm:text-xs"
                    >
                       <UserPlus className="w-3 h-3" /> {t('admin.atribuirMe')}
                    </button>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3 h-3 text-gray-400" />
                  {tags.map((t) => (
                    <span key={t} className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder={t('admin.etiqueta')}
                      value={newTag[lead.id] || ''}
                      onChange={(e) => setNewTag(s => ({ ...s, [lead.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') addTag(lead.id); }}
                      className="w-24 px-2 py-0.5 bg-[#E8D9F5] border border-gray-300 rounded text-[10px] sm:text-xs text-gold focus:border-gold outline-none"
                    />
                    <button
                      onClick={() => addTag(lead.id)}
                      disabled={isSaving}
                      className="px-1.5 py-0.5 bg-white rounded text-[10px] text-gray-500 hover:bg-lilac/20"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <button
                    onClick={() => setNotesOpen(s => ({ ...s, [lead.id]: !isOpen }))}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-gold transition-colors"
                  >
                    <StickyNote className="w-3 h-3" />
                    {t('admin.notasContador', { n: notes.length, s: notes.length === 1 ? '' : 's' })}
                    <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-2 space-y-2">
                      {notes.length === 0 && (
                         <p className="text-xs text-gray-400">{t('admin.semNotas')}</p>
                      )}
                      {notes.map((n, i) => (
                        <div key={i} className="text-xs bg-[#E8D9F5] border border-gray-300 rounded-lg p-2">
                          <div className="text-gray-700 whitespace-pre-wrap break-words">{n.text}</div>
                          <div className="text-gray-400 mt-1">
                             {n.author ? t('admin.por', { author: n.author }) : '—'} — {formatDateTime(n.createdAt)}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-end gap-2">
                        <textarea
                          placeholder={t('admin.addNotaPlaceholder')}
                          value={newNote[lead.id] || ''}
                          onChange={(e) => setNewNote(s => ({ ...s, [lead.id]: e.target.value }))}
                          rows={2}
                          className="flex-1 px-2 py-1 bg-[#E8D9F5] border border-gray-300 rounded text-xs text-gold focus:border-gold outline-none resize-none"
                        />
                        <button
                          onClick={() => addNote(lead.id)}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-gold text-[#374151] rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
                        >
                           <Send className="w-3 h-3" /> {t('admin.addNota')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                {!lead.read && (
                  <button
                    onClick={() => markAsRead(lead.id)}
                    className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors whitespace-nowrap"
                  >
                     {t('admin.marcarLida')}
                  </button>
                )}
                <button
                  onClick={() => deleteLead(lead.id)}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors whitespace-nowrap"
                >
                   {t('admin.eliminar')}
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-[#4B2170] text-white rounded-lg hover:bg-[#7B2FBF] disabled:opacity-50 text-sm"
          >
            {loadingMore ? 'A carregar...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  );
}

// ======================== MAIN DASHBOARD ========================
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useT();
  const [stats, setStats] = useState({
    totalShipments: 0,
    activeShipments: 0,
    deliveredToday: 0,
    totalUsers: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    readyForPickupShipments: 0,
    cancelledShipments: 0,
    totalLeads: 0,
    newLeads: 0,
    previousMonthShipments: 0
  });
  const [revenue, setRevenue] = useState({ thisMonth: 0, pending: 0, paid: 0 });
  const [trends, setTrends] = useState<{ label: string; count: number; revenue: number }[]>([]);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shipmentsRefreshKey, setShipmentsRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'newShipment' | 'shipments' | 'users' | 'routes' | 'messages'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verificar permissões
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
      navigate('/');
      return;
    }
    authenticatedFetchDashboardData();
  }, []);

  const authenticatedFetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Buscar estatísticas
      const statsRes = await authenticatedFetch(api('/api/admin/stats'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsRes.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setStats({
          totalShipments: statsJson.data.totalShipments || 0,
          activeShipments: statsJson.data.activeShipments || 0,
          deliveredToday: 0,
          totalUsers: statsJson.data.totalUsers || 0,
          pendingShipments: statsJson.data.pendingShipments || 0,
          inTransitShipments: statsJson.data.inTransitShipments || 0,
          readyForPickupShipments: statsJson.data.readyForPickupShipments || 0,
          cancelledShipments: statsJson.data.cancelledShipments || 0,
          totalLeads: statsJson.data.totalLeads || 0,
          newLeads: statsJson.data.newLeads || 0,
          previousMonthShipments: statsJson.data.previousMonthShipments || 0
        });
      }

      // Buscar tendências
      const trendsRes = await authenticatedFetch(api('/api/admin/stats/trends'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (trendsRes.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      const trendsJson = await trendsRes.json();
      if (trendsJson.success) {
        setTrends(trendsJson.data || []);
      }

      // Buscar encomendas recentes (últimas 5)
      const shipmentsRes = await authenticatedFetch(api('/api/admin/shipments'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (shipmentsRes.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const shipmentsJson = await shipmentsRes.json();
      if (shipmentsJson.success) {
        const all = shipmentsJson.data || [];
        // Ordenar por createdAt decrescente
        const sorted = all.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        setRecentShipments(sorted.slice(0, 5));

        // Calcular distribuição por status
        const dist: Record<string, number> = {};
        all.forEach((s: any) => {
          dist[s.status] = (dist[s.status] || 0) + 1;
        });
        setStatusDistribution(dist);

        // Calcular faturamento
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        let monthRevenue = 0;
        let pendingRevenue = 0;
        let paidRevenue = 0;
        all.forEach((s: any) => {
          const created = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
          if (created.getMonth() === currentMonth && created.getFullYear() === currentYear) {
            const price = parseFloat(s.price) || 0;
            monthRevenue += price;
            if (s.paymentStatus === 'PAID') paidRevenue += price;
            else pendingRevenue += price;
          }
        });
        setRevenue({ thisMonth: monthRevenue, pending: pendingRevenue, paid: paidRevenue });
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Atualização automática a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'overview') {
        authenticatedFetchDashboardData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const triggerShipmentsRefresh = useCallback(() => {
    setShipmentsRefreshKey(k => k + 1);
  }, []);

  const tabs = [
    { id: 'overview', label: t('admin.tabVisao'), icon: TrendingUp },
    { id: 'newShipment', label: t('admin.tabNovaEncomenda'), icon: Plus },
    { id: 'shipments', label: t('admin.tabEncomendas'), icon: Package },
    { id: 'users', label: t('admin.tabUtilizadores'), icon: Users },
    { id: 'routes', label: t('admin.tabRotas'), icon: MapPin },
    { id: 'messages', label: t('admin.tabMensagens'), icon: Mail },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <Layout>
      <div className="min-h-screen bg-[#1a1133] pt-24 sm:pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-gray-800 flex flex-wrap items-center gap-2">
                  <span className="text-gradient-lilac">{t('admin.titulo')}</span>
                  <span className="text-sm text-gray-400">{t('admin.subtitle')}</span>
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('admin.desc')}</p>
              </div>
              <button
                onClick={authenticatedFetchDashboardData}
                disabled={refreshing}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t('admin.atualizando') : t('admin.atualizar')}
              </button>
            </div>
          </motion.div>

          {/* Tabs - Desktop */}
          <div className="hidden md:flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gold text-black'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tabs - Mobile (dropdown) */}
          <div className="md:hidden mb-6">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between min-h-[48px] px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800"
            >
              <span className="flex items-center gap-2">
                {currentTab && <currentTab.icon className="w-4 h-4" />}
                {currentTab?.label}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileMenuOpen && (
              <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 min-h-[48px] px-4 py-3 text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gold/20 text-gold'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <>
                <StatsCards stats={stats} trends={trends} />
                <ExportButtons />
                <AlertsSection stats={stats} revenue={revenue} />
                <FinancialOverview revenue={revenue} />
                {trends.length > 0 && (
                  <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl mb-6">
                    <h3 className="font-semibold mb-4 text-sm sm:text-base">{t('admin.evolucaoMensal')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {trends.map((trend, i) => (
                        <div key={i} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">{trend.label}</div>
                          <div className="text-lg font-bold text-gray-800">{trend.count}</div>
                          <div className="text-[10px] text-gray-400">{t('admin.encomendas')}</div>
                          <div className="text-xs font-medium text-green-600 mt-1">€ {trend.revenue.toFixed(0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-6">
                  <RecentShipments shipments={recentShipments} onViewAll={() => setActiveTab('shipments')} />
                  <StatusDistribution distribution={statusDistribution} />
                </div>
              </>
            )}

            {activeTab === 'newShipment' && (
              <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
                <NewShipmentForm />
              </div>
            )}
            {activeTab === 'shipments' && (
              <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
                <AdminShipmentList refreshKey={shipmentsRefreshKey} />
              </div>
            )}
            {activeTab === 'users' && (
              <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
                <AdminUserList />
              </div>
            )}
            {activeTab === 'routes' && (
              <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
                <AdminRouteManager onRouteStatusChange={triggerShipmentsRefresh} />
              </div>
            )}
            {activeTab === 'messages' && (
              <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
                <AdminLeadsList />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}