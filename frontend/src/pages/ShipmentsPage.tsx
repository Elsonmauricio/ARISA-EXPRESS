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
import { Link } from 'react-router-dom';

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
  createdAt: string;
  senderName: string;
  receiverName: string;
}

// ======================== BOOKING FORM ========================
function BookingForm({ routes }: { routes: Route[] }) {
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
      // Preço = pricePerKg * peso (sem taxas)
      const total = selectedRoute.pricePerKg * weight;
      setEstimatedPrice(Math.round(total * 100) / 100);
    }
  }, [selectedRoute, weight]);

  const available = selectedRoute ? Math.max(0, selectedRoute.available) : 0;
  const canReserve = selectedRoute && weight > 0 && weight <= available;

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    // Atualizar formData com os dados da rota e o peso atual
    setFormData({
      ...formData,
      origin: route.origin,
      destination: route.destination,
      serviceType: route.serviceType,
      weight: weight // <-- importante: usar o peso atual
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

    // Se o campo for weight, atualizar também a variável de estado local
    if (name === 'weight') {
      setWeight(parsedValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar campos obrigatórios
    if (!formData.senderName || !formData.senderPhone || !formData.receiverName || !formData.receiverPhone) {
      setError('Preencha todos os campos obrigatórios');
      setLoading(false);
      return;
    }

    // Validar peso
    if (formData.weight <= 0) {
      setError('O peso deve ser maior que 0');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Por favor, faça login para reservar um envio');
        setLoading(false);
        return;
      }

      // Preparar payload
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

      console.log('📦 Enviando reserva:', payload); // Log para depuração

      const response = await fetch('http://localhost:5000/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      console.log('📦 Resposta do servidor:', json); // Log para depuração

      if (json.success) {
        setStep('success');
      } else {
        setError(json.error || 'Erro ao criar encomenda');
      }
    } catch (err) {
      console.error('❌ Erro na requisição:', err);
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="glass-strong border-gradient p-10 rounded-2xl text-center">
        <CheckCircle2 className="w-16 h-16 text-gold mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">✅ Reserva Confirmada!</h3>
        <p className="text-white/60 mb-4">
          A sua encomenda foi registada com sucesso. Em breve receberá um email com o código de rastreio.
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
          Nova Reserva
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
              <MapPin className="text-gold" /> Rotas Disponíveis
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
                            🗓️ {flightDate.toLocaleDateString('pt-PT')}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-gold font-bold">€ {route.pricePerKg}/kg</div>
                        <div className={`text-xs ${avail > 0 ? (isLow ? 'text-orange-400' : 'text-green-400') : 'text-red-400'}`}>
                          {avail > 0 ? `${avail} kg disponíveis` : 'Esgotado'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {routes.length === 0 && (
                <div className="text-center text-white/40 py-8">
                  Nenhuma rota disponível no momento. Volte mais tarde.
                </div>
              )}
            </div>
          </div>

          <div className="glass-strong border-gradient p-6 rounded-2xl flex flex-col justify-center items-center">
            <div className="w-full max-w-sm">
              <h3 className="text-xl font-bold mb-4 text-center">Simulação</h3>
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setWeight(val);
                    // Atualizar também formData.weight para manter consistência
                    setFormData(prev => ({ ...prev, weight: val }));
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white"
                />
              </div>
              {selectedRoute ? (
                <div className="space-y-2 text-sm w-full">
                  <div className="flex justify-between">
                    <span>Preço base ({selectedRoute.pricePerKg}€/kg × {weight}kg)</span>
                    <span>€ {(selectedRoute.pricePerKg * weight).toFixed(2)}</span>
                  </div>
                  {selectedRoute.flightDate && (
                    <div className="flex justify-between text-white/60">
                      <span>Data do Voo</span>
                      <span>{new Date(selectedRoute.flightDate).toLocaleDateString('pt-PT')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/60">
                    <span>Disponível</span>
                    <span className={available >= weight ? 'text-green-400' : 'text-red-400'}>
                      {available} kg
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-gold">€ {estimatedPrice.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white/40 py-8">Selecione uma rota</div>
              )}
              <GoldButton
                className="w-full mt-4"
                disabled={!canReserve}
                onClick={() => selectedRoute && handleRouteSelect(selectedRoute)}
              >
                {!selectedRoute ? 'Selecione uma rota' :
                 weight > available ? `Apenas ${available} kg disponíveis` :
                 'Reservar Agora'}
              </GoldButton>
            </div>
          </div>
        </div>
      )}

      {step === 'form' && selectedRoute && (
        <div className="max-w-2xl mx-auto">
          <div className="glass-strong border-gradient p-8 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Dados da Encomenda</h3>
              <button onClick={() => setStep('simulate')} className="text-sm text-gold hover:underline">
                ← Voltar
              </button>
            </div>

            <div className="bg-white/5 p-4 rounded-xl mb-6 text-sm">
              <div className="flex justify-between">
                <span><strong>Rota:</strong> {selectedRoute.origin} → {selectedRoute.destination}</span>
                <span><strong>Serviço:</strong> {selectedRoute.serviceType.replace('_', ' ')}</span>
              </div>
              {selectedRoute.flightDate && (
                <div className="flex justify-between mt-1">
                  <span><strong>Data do Voo:</strong></span>
                  <span>{new Date(selectedRoute.flightDate).toLocaleDateString('pt-PT')}</span>
                </div>
              )}
              <div className="flex justify-between mt-1">
                <span><strong>Peso:</strong> {weight} kg</span>
                <span><strong>Preço:</strong> € {estimatedPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span><strong>Disponível:</strong> {available} kg</span>
                <span className={available >= weight ? 'text-green-400' : 'text-red-400'}>
                  {available >= weight ? '✓ Suficiente' : '⚠️ Insuficiente'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Remetente *</label>
                  <input type="text" name="senderName" value={formData.senderName} onChange={handleInputChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Telefone *</label>
                  <input type="tel" name="senderPhone" value={formData.senderPhone} onChange={handleInputChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Destinatário *</label>
                  <input type="text" name="receiverName" value={formData.receiverName} onChange={handleInputChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Telefone *</label>
                  <input type="tel" name="receiverPhone" value={formData.receiverPhone} onChange={handleInputChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Comprimento (cm)</label>
                  <input type="number" name="length" value={formData.length} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Largura (cm)</label>
                  <input type="number" name="width" value={formData.width} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Altura (cm)</label>
                  <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">Descrição</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white resize-none" placeholder="Ex: Roupas, eletrónicos..." />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <GoldButton type="submit" className="w-full py-3" disabled={loading || !canReserve}>
                {loading ? 'A processar...' : 'Confirmar Reserva'}
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

      const response = await fetch('http://localhost:5000/api/shipments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Erro ao buscar encomendas:', response.status, text);
        setError(`Erro ${response.status}: Não foi possível carregar as encomendas.`);
        return;
      }

      const json = await response.json();
      if (json.success) {
        setShipments(json.data);
      } else {
        setError(json.error || 'Erro ao carregar encomendas');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      setError('Erro de conexão com o servidor.');
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

  if (loading) return <div className="text-center py-8 text-white/60">A carregar encomendas...</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;
  if (!localStorage.getItem('token')) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>Faça login para ver as suas encomendas.</p>
        <Link to="/login" className="text-gold hover:underline">Iniciar sessão</Link>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Não tem encomendas registadas.</p>
        <p className="text-sm">Utilize o formulário acima para criar a sua primeira reserva.</p>
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
            <div className="text-xs text-white/50">{new Date(s.createdAt).toLocaleDateString('pt-PT')}</div>
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

// ======================== PRICE TABLE ========================
function PriceTable({ routes }: { routes: Route[] }) {
  return (
    <div className="glass-strong border-gradient p-6 rounded-2xl overflow-x-auto">
      <h3 className="text-xl font-bold mb-4">📊 Tabela de Preços e Disponibilidade</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 text-white/60">Origem</th>
            <th className="text-left py-3 text-white/60">Destino</th>
            <th className="text-left py-3 text-white/60">Serviço</th>
            <th className="text-right py-3 text-white/60">€/kg</th>
            <th className="text-right py-3 text-white/60">Data do Voo</th>
            <th className="text-right py-3 text-white/60">Disponível (kg)</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => {
            const avail = Math.max(0, route.available);
            const isLow = avail < 50 && avail > 0;
            const flightDate = route.flightDate ? new Date(route.flightDate) : null;
            return (
              <tr key={route.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3">{route.origin}</td>
                <td className="py-3">{route.destination}</td>
                <td className="py-3">{route.serviceType.replace('_', ' ')}</td>
                <td className="py-3 text-right font-semibold text-gold">€ {route.pricePerKg}</td>
                <td className="py-3 text-right">
                  {flightDate ? flightDate.toLocaleDateString('pt-PT') : '—'}
                </td>
                <td className={`py-3 text-right font-semibold ${avail === 0 ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-green-400'}`}>
                  {avail > 0 ? avail : 'Esgotado'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-4 text-xs text-white/40">
        * Apenas rotas com data futura e capacidade disponível são mostradas.
      </div>
    </div>
  );
}

// ======================== TRACKING FORM ========================
function TrackingForm() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trackingCode = code.trim().toUpperCase();
    if (!trackingCode) {
      setError('Insira um código de rastreio.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`http://localhost:5000/api/tracking/${trackingCode}`);
      const json = await response.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.error || 'Encomenda não encontrada.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
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
          <Search className="text-gold" /> Rastrear Encomenda
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: ARISA-1A2B-3C4D"
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white"
            />
            <GoldButton type="submit" disabled={loading} className="px-6">
              {loading ? '...' : 'Rastrear'}
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
                <div className="text-xs text-white/40">Código</div>
                <div className="font-mono text-gold">{result.trackingCode}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40">Status</div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(result.status)}`}>
                  {getStatusIcon(result.status)}
                  {result.status.replace('_', ' ')}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Origem</span>
                <span className="text-white">{result.origin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Destino</span>
                <span className="text-white">{result.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Peso</span>
                <span className="text-white">{result.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Preço</span>
                <span className="text-white">€ {result.price?.toFixed(2) || '—'}</span>
              </div>
              {result.trackingUpdates && result.trackingUpdates.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-white/40 mb-2">Histórico</div>
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
  const [activeTab, setActiveTab] = useState<'reservar' | 'consultar' | 'rastrear' | 'tabela'>('reservar');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routesError, setRoutesError] = useState('');

  // Ler query param para definir a tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as any;
    if (tab && ['reservar', 'consultar', 'rastrear', 'tabela'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Carregar apenas rotas disponíveis (data futura e capacidade > 0)
  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/routes/available');
      const json = await response.json();
      if (json.success) {
        setRoutes(json.data);
      } else {
        setRoutesError('Erro ao carregar rotas');
      }
    } catch (err) {
      setRoutesError('Erro de conexão ao carregar rotas');
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
              <span className="text-gradient-gold">Encomendas</span>
            </h1>
            <p className="text-white/60 mt-2">Reserve, consulte, rastreie ou veja a tabela de preços.</p>
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
              <Plus className="w-4 h-4 inline mr-1.5" /> Reservar
            </button>
            <button
              onClick={() => setActiveTab('consultar')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'consultar'
                  ? 'bg-gold text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Package className="w-4 h-4 inline mr-1.5" /> Minhas Encomendas
            </button>
            <button
              onClick={() => setActiveTab('rastrear')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'rastrear'
                  ? 'bg-gold text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1.5" /> Rastrear
            </button>
            <button
              onClick={() => setActiveTab('tabela')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'tabela'
                  ? 'bg-gold text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              📊 Tabela de Preços
            </button>
          </div>

          {/* Conteúdo */}
          <div className="mt-6">
            {activeTab === 'reservar' && (
              loadingRoutes ? (
                <div className="text-center py-8 text-white/60">A carregar rotas disponíveis...</div>
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
                <div className="text-center py-8 text-white/60">A carregar rotas...</div>
              ) : routesError ? (
                <div className="text-center py-8 text-red-400">{routesError}</div>
              ) : (
                <PriceTable routes={routes} />
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}