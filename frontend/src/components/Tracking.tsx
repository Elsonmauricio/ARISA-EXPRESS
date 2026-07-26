// src/components/Tracking.tsx
'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { GoldButton } from './Button';
import Timeline, { StepData } from './Timeline';
import { useT } from '../i18n/LanguageContext';
import { api } from '../lib/api';

// ======================== TIPOS ========================
interface TrackingUpdate {
  id?: string;
  status: string;
  location: string;
  description: string;
  timestamp: Date | string;
}

interface TrackingData {
  trackingCode: string;
  origin: string;
  destination: string;
  weight: number;
  price: number;
  status: string;
  createdAt: Date | string;
  trackingUpdates: TrackingUpdate[];
  collectedAt?: Date | string | null;
  inTransitAt?: Date | string | null;
  arrivedAt?: Date | string | null;
  outForDeliveryAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  progress?: number;
  senderName?: string;
  receiverName?: string;
}

interface ApiResponse {
  success: boolean;
  data: TrackingData;
  error?: string;
}

// ======================== FUNÇÃO AUXILIAR ========================
function formatDate(dateValue: Date | string | undefined | null): string {
  if (!dateValue) return '—';
  try {
    const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

// ======================== COMPONENTE PRINCIPAL ========================
export default function Tracking() {
  const { t } = useT();
  const [code, setCode] = useState<string>('');
  const [result, setResult] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trackingCode = code.trim();
    if (!trackingCode) {
      setError(t('track.erroCodigo'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        api(`/api/tracking/${encodeURIComponent(trackingCode.toUpperCase())}`)
      );

      if (!response.ok) {
        throw new Error(t('track.erroStatus', { status: response.status, statusText: response.statusText }));
      }

      const json: ApiResponse = await response.json();

      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setError(json.error || t('track.naoEncontrada'));
      }
    } catch (err: any) {
      console.error('Erro ao rastrear:', err);
      setError(t('track.erroServidor'));
    } finally {
      setLoading(false);
    }
  };

  const getTimelineStep = (steps: StepData[]): number => {
    return steps.length - 1;
  };

  const buildSteps = (data: TrackingData): StepData[] => {
    const status = data.status;
    const steps: StepData[] = [];

    if (status === 'CANCELLED') {
      steps.push({
        id: 'step-cancelled',
        icon: 'XCircle',
        title: t('track.cancelada'),
        description: t('track.canceladaDesc'),
        date: formatDate(data.createdAt),
      });
      return steps;
    }

    steps.push({
      id: 'step-1',
      icon: 'Mailbox',
      title: t('track.recebido'),
      description: t('track.hubLisboa'),
      date: formatDate(data.createdAt),
    });

    if (['COLLECTED', 'IN_TRANSIT', 'CUSTOMS', 'IN_PORTUGAL', 'IN_ANGOLA', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      steps.push({
        id: 'step-2',
        icon: 'Package',
        title: t('track.recolhido'),
        description: t('track.recolhidoDesc'),
        date: formatDate(data.collectedAt),
      });
    }

    if (['IN_TRANSIT', 'IN_PORTUGAL', 'IN_ANGOLA', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      const transitStatuses: string[] = [];
      if (status === 'CUSTOMS') {
        steps.push({
          id: 'step-3',
          icon: 'Warehouse',
          title: t('track.alfandega'),
          description: t('track.alfandegaDesc'),
          date: formatDate(data.arrivedAt),
        });
      } else {
        steps.push({
          id: 'step-3',
          icon: 'Plane',
          title: t('track.emTransito'),
          description: t('track.vooTap'),
          date: formatDate(data.inTransitAt),
        });
      }
    }

    if (['IN_PORTUGAL', 'IN_ANGOLA', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      const isAngola = data.destination?.toLowerCase().includes('angola') || data.destination?.toLowerCase().includes('luanda') || data.destination?.toLowerCase().includes('benguela');
      const isPortugal = data.destination?.toLowerCase().includes('portugal') || data.destination?.toLowerCase().includes('lisboa') || data.destination?.toLowerCase().includes('porto');
      const location = isAngola ? 'AO' : isPortugal ? 'PT' : '';
      if (status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') {
        steps.push({
          id: 'step-4',
          icon: 'Truck',
          title: t('track.saidaEntrega'),
          description: t('track.distribuicao'),
          date: formatDate(data.outForDeliveryAt),
        });
      } else {
        steps.push({
          id: 'step-4',
          icon: 'MapPin',
          title: location === 'AO' ? t('track.chegadaAngola') : location === 'PT' ? t('track.chegadaPortugal') : t('track.chegadaDestino'),
          description: location === 'AO' ? t('track.aeroporto') : location === 'PT' ? t('track.hubPortugal') : t('track.destino'),
          date: formatDate(data.arrivedAt),
        });
      }
    }

    if (status === 'DELIVERED' && data.deliveredAt) {
      steps.push({
        id: 'step-5',
        icon: 'Check',
        title: t('track.entregue'),
        description: t('track.entregueDesc'),
        date: formatDate(data.deliveredAt),
      });
    }

    return steps;
  };

  return (
    <section id="rastrear" className="relative py-28 min-h-screen flex flex-col justify-center">
      <div className="container mx-auto max-w-5xl px-4">
        <SectionHeading
          align="center"
          eyebrow={t('track.eyebrow')}
          title={
            <>
              {t('track.title1')}<span className="text-gradient-lilac">{t('track.title2')}</span>{t('track.title3')}
            </>
          }
          subtitle={t('track.subtitle')}
        />

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 mx-auto max-w-xl"
        >
          <div className="flex items-center gap-2 glass-strong rounded-full p-2 border-gradient focus-within:shadow-glow transition-shadow">
            <Search className="w-5 h-5 text-white/40 ml-4 shrink-0" />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError('');
              }}
              placeholder={t('track.inputPlaceholder')}
              className="flex-1 bg-transparent outline-none px-2 py-2 text-sm placeholder:text-white/30 text-white"
              disabled={loading}
            />
            <GoldButton type="submit" className="px-5 py-2.5 text-sm" disabled={loading}>
              {loading ? t('track.buscando') : t('track.botao')}
            </GoldButton>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 flex items-center justify-center gap-2 text-xs text-red-300"
              >
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.trackingCode}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="mt-14 glass-strong rounded-3xl p-6 md:p-10 border-gradient"
            >
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                     <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-1">
                     {t('track.labelCodigo')}
                   </div>
                  <div className="font-display text-2xl md:text-3xl text-white">
                    {result.trackingCode}
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">
                     {t('track.labelEstado')}
                   </div>
                  <div className="text-gold font-semibold">
                    {result.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                 <div>
                   <div className="text-[10px] text-white/40 uppercase tracking-wider">{t('track.labelOrigem')}</div>
                   <div className="text-sm text-white font-medium">{result.origin}</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-white/40 uppercase tracking-wider">{t('track.labelDestino')}</div>
                   <div className="text-sm text-white font-medium">{result.destination}</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-white/40 uppercase tracking-wider">{t('track.labelPeso')}</div>
                   <div className="text-sm text-white font-medium">{result.weight} {t('track.kg')}</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-white/40 uppercase tracking-wider">{t('track.labelPreco')}</div>
                   <div className="text-sm text-white font-medium">{t('track.euro')} {result.price?.toFixed(2) ?? '—'}</div>
                 </div>
              </div>

              <Timeline
                steps={buildSteps(result)}
                currentStep={getTimelineStep(buildSteps(result))}
              />

              {result.trackingUpdates && result.trackingUpdates.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                   <div className="text-xs text-white/40 uppercase tracking-wider mb-3">{t('track.historico')}</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                    {result.trackingUpdates.map((update, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                        <span className="text-white/80">{update.description || update.status.replace('_', ' ')}</span>
                        <span className="text-xs text-white/40">{formatDate(update.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}