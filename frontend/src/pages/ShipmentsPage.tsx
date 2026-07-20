// src/pages/ShipmentsPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, Truck, Plane, MapPin, Search,
  AlertCircle, CheckCircle2, Clock, XCircle,
  Plus, ChevronDown
} from 'lucide-react';
import { GoldButton } from '../components/Button';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { useT } from '../i18n/LanguageContext';

// ======================== TIPOS ========================
interface Route {
  id: string;
  origin: string;
  destination: string;
  pricePerKg: number;
  flightDate: string;
  serviceType: 'AIR_EXPRESS' | 'AIR_ECONOMY' | 'MARITIME' | 'BUSINESS';
  capacity: number;
  reserved: number;
  available: number;
}

interface Shipment {
  id: string;
  trackingCode: string;
  origin: string;
  destination: string;
  weight: number;
  price: number;
  status: string;
  createdAt: any; // Pode ser Timestamp do Firestore, string ISO ou Date
  senderName: string;
  receiverName: string;
  flightDate?: any; // Opcional, para mostrar na lista se existir
}

// ======================== FUNÇÃO AUXILIAR PARA FORMATAR DATAS ========================
function formatDate(dateValue: any): string {
  if (!dateValue) return '—';
  try {
    // Se for Timestamp do Firestore (objeto com toDate)
    if (typeof dateValue === 'object' && dateValue.toDate) {
      return dateValue.toDate().toLocaleDateString('pt-PT');
    }
    // Se for string ISO
    if (typeof dateValue === 'string') {
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-PT');
    }
    // Se for objeto Date
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString('pt-PT');
    }
    return '—';
  } catch {
    return '—';
  }
}

// ======================== BOOKING FORM ========================
function BookingForm({ routes }: { routes: Route[] }) {
  const { t } = useT();
  const [step, setStep] = useState<'simulate' | 'form' | 'success'>('simulate');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [weight, setWeight] = useState<number>(1);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    weight: 1,
    length: 0,
    width: 0,
    height: 0,
    description: '',
    serviceType: 'AIR_EXPRESS'
  });

  useEffect(() => {
    if (selectedRoute) {
      const total = selectedRoute.pricePerKg * weight;
      setEstimatedPrice(Math.round(total * 100) / 100);
    }
  }, [selectedRoute, weight]);

  const available = selectedRoute ? Math.max(0, selectedRoute.available) : 0;
  const canReserve = selectedRoute && weight > 0 && weight <= available;

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    setFormData({
      ...formData,
      origin: route.origin,
      destination: route.destination,
      serviceType: route.serviceType,
      weight: weight
    });
    setStep('form');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue = name === 'weight' || name === 'length' || name === 'width' || name === 'height'
      ? parseFloat(value) || 0
      : value;
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });

    if (name === 'weight') {
      setWeight(parseFloat(value) || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.senderName || !formData.senderPhone || !formData.receiverName || !formData.receiverPhone) {
      setError(t('ship.camposObrigatorios'));
      setLoading(false);
      return;
    }

    if (formData.weight <= 0) {
      setError(t('ship.pesoMaior'));
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('ship.loginReservar'));
        setLoading(false);
        return;
      }

      const payload = {
        origin: formData.origin,
        destination: formData.destination,
        senderName: formData.senderName,
        senderPhone: formData.senderPhone,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        weight: formData.weight,
        dimensions: {
          length: formData.length || 0,
          width: formData.width || 0,
          height: formData.height || 0
        },
        description: formData.description || '',
        serviceType: formData.serviceType
      };

      const response = await fetch(api('/api/shipments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      if (json.success) {
        setStep('success');
      } else {
        setError(json.error || t('ship.erroCriar'));
      }
    } catch (err) {
      setError(t('ship.erroServidor'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="glass-strong border-gradient p-10 rounded-2xl text-center">
        <CheckCircle2 className="w-16 h-16 text-gold mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">{t('ship.reservaConfirmada')}</h3>
        <p className="text-white/60 mb-4">
          {t('ship.reservaSucesso')}
        </p>
        <GoldButton onClick={() => {
          setStep('simulate');
          setSelectedRoute(null);
          setWeight(1);
          setFormData({
            origin: '', destination: '', senderName: '', senderPhone: '',
            receiverName: '', receiverPhone: '', weight: 1,
            length: 0, width: 0, height: 0, description: '', serviceType: 'AIR_EXPRESS'
          });
        }}>
          {t('ship.novaReserva')}
        </GoldButton>
      </div>
    );
  }

  return (
    <div>
      {step === 'simulate' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-strong border-gradient p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="text-gold" /> {t('ship.rotasDisp')}
              </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {routes.map((route) => {
                const avail = Math.max(0, route.available);
                const isLow = avail < 50 && avail > 0;
                const flightDate = route.flightDate ? new Date(route.flightDate) : null;
                return (
                  <div
                    key={route.id}
                    onClick={() => handleRouteSelect(route)}
                    className="p-4 rounded-xl border border-white/10 hover:border-gold/50 cursor-pointer transition-all hover:bg-white/5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{route.origin} → {route.destination}</div>
                        <div className="text-sm text-white/60">
                          {route.serviceType.replace('_', ' ')}
                        </div>
                        {flightDate && (
                          <div className="text-xs text-white/40 mt-1">
                            {t('ship.dataVoo2', { date: flightDate.toLocaleDateString('pt-PT') })}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-gold font-bold">{t('ship.precoKg', { price: route.pricePerKg })}</div>
                        <div className={`text-xs ${avail > 0 ? (isLow ? 'text-orange-400' : 'text-green-400') : 'text-red-400'}`}>
                          {avail > 0 ? t('ship.kgDisp', { avail }) : t('ship.esgotado')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {routes.length === 0 && (
                <div className="text-center text-white/40 py-8">
                  {t('ship.semRotas')}
                </div>
              )}
            </div>
          </div>

          <div className="glass-strong border-gradient p-6 rounded-2xl flex flex-col justify-center items-center">
            <div className="w-full max-w-sm">
              <h3 className="text-xl font-bold mb-4 text-center">{t('ship.simulacao')}</h3>
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-1">{t('ship.peso')}</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setWeight(val);
                    setFormData(prev => ({ ...prev, weight: val }));
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white"
                />
              </div>
              {selectedRoute ? (
                <div className="space-y-2 text-sm w-full">
                  <div className="flex justify-between">
                    <span>{t('ship.precoBase', { pricePerKg: selectedRoute.pricePerKg, weight })}</span>
                    <span>€ {(selectedRoute.pricePerKg * weight).toFixed(2)}</span>
                  </div>
                  {selectedRoute.flightDate && (
                    <div className="flex justify-between text-white/60">
                      <span>{t('ship.dataVoo')}</span>
                      <span>{new Date(selectedRoute.flightDate).toLocaleDateString('pt-PT')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/60">
                    <span>{t('ship.disponivel')}</span>
                    <span className={available >= weight ? 'text-green-400' : 'text-red-400'}>
                      {available} kg
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-lg">
                    <span>{t('ship.total')}</span>
                    <span className="text-gold">{t('ship.totalValor', { estimatedPrice: estimatedPrice.toFixed(2) })}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white/40 py-8">{t('ship.selecionarRota')}</div>
              )}
              <GoldButton
                className="w-full mt-4"
                disabled={!canReserve}
                onClick={() => selectedRoute && handleRouteSelect(selectedRoute)}
              >
                {!selectedRoute ? t('ship.selecionarRota') :
                 weight > available ? t('ship.kgDisponiveis', { available }) :
                 t('ship.reservarAgora')}
              </GoldButton>
            </div>
          </div>
        </div>
      )}

      {step === 'form' && selectedRoute && (
        <div className="max-w-2xl mx-auto">
          <div className="glass-strong border-gradient p-8 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{t('ship.dadosEncomenda')}</h3>
              <button onClick={() => setStep('simulate')} className="text-sm text-gold hover:underline">
                {t('ship.voltar')}
              </button>
            </div>

            <div className="bg-white/5 p-4 rounded-xl mb-6 text-sm">
              <div className="flex justify-between">
                <span><strong>{t('ship.rota')}</strong> {selectedRoute.origin} → {selectedRoute.destination}</span>
                <span><strong>{t('ship.servico')}</strong> {selectedRoute.serviceType.replace('_', ' ')}</span>
              </div>
              {selectedRoute.flightDate && (
                <div className="flex justify-between mt-1">
                  <span><strong>{t('ship.dataVoo3')}</strong></span>
                  <span>{new Date(selectedRoute.flightDate).toLocaleDateString('pt-PT')}</span>
                </div>
              )}
              <div className="flex justify-between mt-1">
                  <span><strong>{t('ship.peso2')}</strong> {weight} kg</span>
                  <span><strong>{t('ship.preco')}</strong> € {estimatedPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1">
                  <span><strong>{t('ship.disponivel2')}</strong> {available} kg</span>
                <span className={available >= weight ? 'text-green-400' : 'text-red-400'}>
                  {available >= weight ? t('ship.suficiente') : t('ship.insuficiente')}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('ship.remetente')}</label>
                  <input type="text" name="senderName" value={formData.senderName} onChange={handleInputChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
                 <div>
                   <label className="block text-sm text-white/60 mb-1">{t('ship.remetenteTel')}</label>
                   <input type="tel" name="senderPhone" value={formData.senderPhone} onChange={handleInputChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                 </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('ship.destinatario')}</label>
                  <input type="text" name="receiverName" value={formData.receiverName} onChange={handleInputChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('ship.destinatarioTel')}</label>
                  <input type="tel" name="receiverPhone" value={formData.receiverPhone} onChange={handleInputChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('ship.comprimento')}</label>
                  <input type="number" name="length" value={formData.length} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('ship.largura')}</label>
                  <input type="number" name="width" value={formData.width} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">{t('ship.altura')}</label>
                  <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">{t('ship.descricao')}</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white resize-none"                   placeholder={t('ship.descricaoPlaceholder')} />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <GoldButton type="submit" className="w-full py-3" disabled={loading || !canReserve}>
                {loading ? t('ship.aProcessar') : t('ship.confirmarReserva')}
              </GoldButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== SHIPMENT LIST ========================
function ShipmentList() {
  const { t } = useT();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(api('/api/shipments'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Erro ao buscar encomendas:', response.status, text);
        setError(t('ship.erroStatus', { status: response.status }));
        return;
      }

      const json = await response.json();
      if (json.success) {
        setShipments(json.data);
      } else {
        setError(json.error || t('ship.erroCarregarEncomendas'));
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      setError(t('ship.erroServidor'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

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
      CANCELLED: 'text-red-400 bg-red-400/10'
    };
    return colors[status] || 'text-white/60 bg-white/10';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'DELIVERED') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'CANCELLED') return <XCircle className="w-4 h-4" />;
    if (status === 'OUT_FOR_DELIVERY') return <Truck className="w-4 h-4" />;
    if (status === 'IN_TRANSIT') return <Plane className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  // Função para formatar datas do Firestore
  const formatDate = (dateValue: any): string => {
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
  };

  if (loading) return <div className="text-center py-8 text-white/60">{t('ship.carregarEncomendas')}</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;
  if (!localStorage.getItem('token')) {
    return (
      <div className="text-center py-8 text-white/60">
          <p>{t('ship.loginEncomendas')}</p>
          <Link to="/login" className="text-gold hover:underline">{t('ship.iniciarSessao')}</Link>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{t('ship.semEncomendas')}</p>
        <p className="text-sm">{t('ship.usarFormulario')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shipments.map((s) => (
        <div key={s.id} className="glass-strong border-gradient p-4 rounded-xl flex flex-wrap justify-between items-center gap-3">
          <div>
            <div className="font-mono text-sm text-gold">{s.trackingCode}</div>
            <div className="text-sm text-white/80">{s.origin} → {s.destination}</div>
            {/* Data de criação formatada */}
            <div className="text-xs text-white/50">{formatDate(s.createdAt)}</div>
            {/* Opcional: mostrar data do voo se existir */}
            {s.flightDate && (
              <div className="text-xs text-white/40">Voo: {t('ship.voo', { date: formatDate(s.flightDate) })}</div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold">€ {s.price?.toFixed(2) || '—'}</div>
              <div className="text-xs text-white/50">{s.weight} kg</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(s.status)}`}>
              {getStatusIcon(s.status)}
              {s.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// src/pages/ShipmentsPage.tsx – componente PriceTable refatorado

// ======================== PRICE TABLE ========================
function PriceTable() {
  const { t } = useT();
  // Dados estáticos baseados nas imagens fornecidas
  const baseItems = [
    { item: t('ship.kg'), euro: '13,00', kz: '16.900,00' },
    { item: t('ship.alimentos'), euro: t('ship.porKg'), kz: '—' },
    { item: t('ship.roupas'), euro: t('ship.porKg'), kz: '—' },
    { item: t('ship.calcados'), euro: t('ship.porKg'), kz: '—' },
    { item: t('ship.diversos'), euro: t('ship.porKg'), kz: '—' },
  ];

  const malas = [
    { peso: t('ship.kg5'), euro: '85,00', kz: '110.500,00' },
    { peso: t('ship.kg10'), euro: '110,00', kz: '143.000,00' },
    { peso: t('ship.kg23'), euro: '200,00', kz: '260.000,00' },
    { peso: t('ship.kg32'), euro: '300,00', kz: '390.000,00' },
  ];

  const eletronicos = [
    { item: t('ship.telemovel'), euro: '35,00', kz: '45.000,00' },
    { item: t('ship.smartwatch'), euro: '15,00', kz: '19.500,00' },
    { item: t('ship.airpods'), euro: '15,00', kz: '19.500,00' },
    { item: t('ship.computador'), euro: '50,00 / 60,00', kz: '65.000,00 / 78.000,00' },
    { item: t('ship.ps4'), euro: '60,00', kz: '78.000,00' },
    { item: t('ship.ps5'), euro: '90,00', kz: '117.000,00' },
  ];

  const pessoais = [
    { item: t('ship.documentos'), euro: '15,00', kz: '19.500,00' },
    { item: t('ship.passaporte'), euro: '20,00', kz: '26.000,00' },
    { item: t('ship.medicamentos'), euro: '5,00', kz: '6.500,00' },
    { item: t('ship.ouro'), euro: '15,00 / 25,00', kz: '19.500,00 / 32.500,00' },
    { item: t('ship.peruca'), euro: '7,00', kz: '9.100,00' },
    { item: t('ship.outros'), euro: t('ship.sobConsulta'), kz: t('ship.sobConsulta') },
  ];

  const alfandega = [
    { item: t('ship.perfumes'), euro: t('ship.kg46'), kz: t('ship.kg35') },
    { item: t('ship.cosmetica'), euro: t('ship.kg46'), kz: t('ship.kg35') },
    { item: t('ship.manicure'), euro: t('ship.kg23Alfandega'), kz: t('ship.kg23Alfandega') },
    { item: t('ship.som'), euro: t('ship.kg23Alfandega'), kz: t('ship.kg23Alfandega') },
    { item: t('ship.carro'), euro: t('ship.kg23Alfandega'), kz: t('ship.kg23Alfandega') },
    { item: t('ship.tv'), euro: t('ship.kg23Alfandega'), kz: t('ship.195kz') },
  ];

  return (
    <div className="space-y-8">
      <div className="glass-strong border-gradient p-6 rounded-2xl overflow-x-auto">
        <h3 className="text-xl font-bold mb-4">{t('ship.tabelaTitulo')}</h3>
        <p className="text-sm text-white/60 mb-4">
          {t('ship.tabelaSub')} <br />
          <span className="text-xs">{t('ship.tabelaNota')}</span>
        </p>

        {/* Items Base */}
        <h4 className="text-lg font-semibold text-gold mt-6 mb-3">{t('ship.itemsBase')}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 text-white/60">{t('ship.item')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.euro')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.kwanza')}</th>
            </tr>
          </thead>
          <tbody>
            {baseItems.map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2">{row.item}</td>
                <td className="py-2 text-right">{row.euro}</td>
                <td className="py-2 text-right">{row.kz}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Malas */}
        <h4 className="text-lg font-semibold text-gold mt-8 mb-3">{t('ship.malas')}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 text-white/60">{t('ship.pesoMalas')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.euro')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.kwanza')}</th>
            </tr>
          </thead>
          <tbody>
            {malas.map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2">{row.peso}</td>
                <td className="py-2 text-right">{row.euro}</td>
                <td className="py-2 text-right">{row.kz}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-white/40 mt-2">
          {t('ship.notaAlfandega')}
        </p>

        {/* Eletrónicos */}
        <h4 className="text-lg font-semibold text-gold mt-8 mb-3">{t('ship.eletronicos')}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 text-white/60">{t('ship.item')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.euro')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.kwanza')}</th>
            </tr>
          </thead>
          <tbody>
            {eletronicos.map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2">{row.item}</td>
                <td className="py-2 text-right">{row.euro}</td>
                <td className="py-2 text-right">{row.kz}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Itens Pessoais */}
        <h4 className="text-lg font-semibold text-gold mt-8 mb-3">{t('ship.pessoais')}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 text-white/60">{t('ship.item')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.euro')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.kwanza')}</th>
            </tr>
          </thead>
          <tbody>
            {pessoais.map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2">{row.item}</td>
                <td className="py-2 text-right">{row.euro}</td>
                <td className="py-2 text-right">{row.kz}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Itens Alfândega */}
        <h4 className="text-lg font-semibold text-gold mt-8 mb-3">{t('ship.alfandega')}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 text-white/60">{t('ship.item')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.euro')}</th>
              <th className="text-right py-2 text-white/60">{t('ship.kwanza')}</th>
            </tr>
          </thead>
          <tbody>
            {alfandega.map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2">{row.item}</td>
                <td className="py-2 text-right">{row.euro}</td>
                <td className="py-2 text-right">{row.kz}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Contactos */}
        <div className="mt-8 pt-4 border-t border-white/10 text-center">
          <p className="text-sm text-white/60">{t('ship.maisInfo')}</p>
          <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm text-white/80">
            <span>📞 (+244) 948 440 920</span>
            <span>📞 (+351) 934 292 082</span>
          </div>
        </div>
      </div>
    </div>
  );
}
// ======================== TRACKING FORM ========================
function TrackingForm() {
  const { t } = useT();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trackingCode = code.trim().toUpperCase();
    if (!trackingCode) {
      setError(t('ship.erroCodigo'));
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(api(`/api/tracking/${trackingCode}`));
      const json = await response.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.error || t('ship.encomendaNaoEncontrada'));
      }
    } catch (err) {
      setError(t('ship.erroServidor2'));
    } finally {
      setLoading(false);
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
      CANCELLED: 'text-red-400 bg-red-400/10'
    };
    return colors[status] || 'text-white/60 bg-white/10';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'DELIVERED') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'CANCELLED') return <XCircle className="w-4 h-4" />;
    if (status === 'OUT_FOR_DELIVERY') return <Truck className="w-4 h-4" />;
    if (status === 'IN_TRANSIT') return <Plane className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="glass-strong border-gradient p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Search className="text-gold" /> {t('ship.rastrearEncomenda')}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('ship.rastrearPlaceholder')}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white"
            />
            <GoldButton type="submit" disabled={loading} className="px-6">
              {loading ? '...' : t('ship.rastrearBotao')}
            </GoldButton>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </form>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                 <div className="text-xs text-white/40">{t('ship.codigo')}</div>
                <div className="font-mono text-gold">{result.trackingCode}</div>
              </div>
              <div className="text-right">
                 <div className="text-xs text-white/40">{t('ship.status')}</div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(result.status)}`}>
                  {getStatusIcon(result.status)}
                  {result.status.replace('_', ' ')}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">{t('ship.origem')}</span>
                <span className="text-white">{result.origin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{t('ship.destino')}</span>
                <span className="text-white">{result.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{t('ship.peso')}</span>
                <span className="text-white">{result.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{t('ship.precoLabel')}</span>
                <span className="text-white">{result.price?.toFixed(2) || '—'}</span>
              </div>
              {result.trackingUpdates && result.trackingUpdates.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-white/40 mb-2">{t('ship.historico')}</div>
                  <ul className="space-y-1 text-xs text-white/60">
                    {result.trackingUpdates.map((update: any, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span>{update.status.replace('_', ' ')}</span>
                        <span>{new Date(update.timestamp).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ======================== MAIN PAGE ========================
export default function ShipmentsPage() {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<'reservar' | 'consultar' | 'rastrear' | 'tabela'>('reservar');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routesError, setRoutesError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as any;
    if (tab && ['reservar', 'consultar', 'rastrear', 'tabela'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch(api('/api/routes/available'));
      const json = await response.json();
      if (json.success) {
        setRoutes(json.data);
      } else {
        setRoutesError(t('ship.erroCarregarRotas'));
      }
    } catch (err) {
      setRoutesError(t('ship.erroConexaoRotas'));
    } finally {
      setLoadingRoutes(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white">
              <span className="text-gradient-gold">{t('ship.titulo')}</span>
            </h1>
            <p className="text-white/60 mt-2">{t('ship.subtitle')}</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
            <button
              onClick={() => setActiveTab('reservar')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'reservar'
                  ? 'bg-gold text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-1.5" /> {t('ship.tabReservar')}
            </button>
            <button
              onClick={() => setActiveTab('consultar')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'consultar'
                  ? 'bg-gold text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Package className="w-4 h-4 inline mr-1.5" /> {t('ship.tabMinhas')}
            </button>
            <button
              onClick={() => setActiveTab('rastrear')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'rastrear'
                  ? 'bg-gold text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1.5" /> {t('ship.tabRastrear')}
            </button>
            <button
              onClick={() => setActiveTab('tabela')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'tabela'
                  ? 'bg-gold text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {t('ship.tabTabela')}
            </button>
          </div>

          {/* Conteúdo */}
          <div className="mt-6">
            {activeTab === 'reservar' && (
              loadingRoutes ? (
                <div className="text-center py-8 text-white/60">{t('ship.carregarRotas')}</div>
              ) : routesError ? (
                <div className="text-center py-8 text-red-400">{routesError}</div>
              ) : (
                <BookingForm routes={routes} />
              )
            )}
            {activeTab === 'consultar' && <ShipmentList />}
            {activeTab === 'rastrear' && <TrackingForm />}
            {activeTab === 'tabela' && (
              loadingRoutes ? (
                <div className="text-center py-8 text-white/60">{t('ship.carregarRotas2')}</div>
              ) : routesError ? (
                <div className="text-center py-8 text-red-400">{routesError}</div>
              ) : (
                <PriceTable/>
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
