// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, Truck, Users, TrendingUp,
  AlertCircle, CheckCircle2, Clock, XCircle,
  Search, Plus, Edit, Trash2, MapPin,
  ChevronDown, RefreshCw, Mail
} from 'lucide-react';
import { GoldButton } from '../components/Button';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

// ======================== TIPOS ========================
interface Shipment {
  id: string;
  trackingCode: string;
  origin: string;
  destination: string;
  weight: number;
  price: number;
  status: string;
  createdAt: any;
  senderName: string;
  receiverName: string;
  userId: string;
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
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: any;
  read: boolean;
  status?: string;
}

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
function StatsCards({ stats }: { stats: any }) {
  const cards = [
    { label: 'Total Encomendas', value: stats.totalShipments || 0, icon: Package, color: 'text-blue-400' },
    { label: 'Em Trânsito', value: stats.activeShipments || 0, icon: Truck, color: 'text-lilac-400' },
    { label: 'Entregues Hoje', value: stats.deliveredToday || 0, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Utilizadores', value: stats.totalUsers || 0, icon: Users, color: 'text-gold' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-white/60">{card.label}</div>
              <div className="text-xl sm:text-2xl font-bold text-white">{card.value}</div>
            </div>
            <card.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${card.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ======================== ADMIN SHIPMENT LIST ========================
function AdminShipmentList() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Não autenticado');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/shipments', {
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
        setShipments(json.data);
        setError('');
      } else {
        setError(json.error || 'Erro ao carregar encomendas');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/shipments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, location: 'Luanda', description: `Status atualizado para ${status}` })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const json = await response.json();
      if (json.success) {
        fetchShipments();
      }
    } catch (err) {
      alert('Erro ao atualizar status');
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

  const filtered = shipments.filter(s => {
    const matchFilter = filter === 'all' || s.status === filter;
    const matchSearch = s.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
                        s.senderName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="text-center py-8 text-white/60">A carregar encomendas...</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Pesquisar por código ou remetente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white text-sm"
            />
          </div>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-gold outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="COLLECTED">Recolhida</option>
          <option value="IN_TRANSIT">Em Trânsito</option>
          <option value="CUSTOMS">Alfândega</option>
          <option value="IN_PORTUGAL">Em Portugal</option>
          <option value="IN_ANGOLA">Em Angola</option>
          <option value="OUT_FOR_DELIVERY">Saiu para Entrega</option>
          <option value="DELIVERED">Entregue</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <button
          onClick={fetchShipments}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Código</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm hidden sm:table-cell">Remetente</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Rota</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm hidden md:table-cell">Peso</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm hidden lg:table-cell">Preço</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Status</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-2 sm:px-4 font-mono text-gold text-xs sm:text-sm">{s.trackingCode}</td>
                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">{s.senderName}</td>
                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{s.origin} → {s.destination}</td>
                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">{s.weight} kg</td>
                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">€ {s.price?.toFixed(2) || '—'}</td>
                  <td className="py-3 px-2 sm:px-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusColor(s.status)}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    <select
                      value={s.status}
                      onChange={(e) => updateStatus(s.id, e.target.value)}
                      className="px-1 sm:px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] sm:text-xs text-white focus:border-gold outline-none max-w-[100px]"
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="COLLECTED">Recolhida</option>
                      <option value="IN_TRANSIT">Em Trânsito</option>
                      <option value="CUSTOMS">Alfândega</option>
                      <option value="IN_PORTUGAL">Em Portugal</option>
                      <option value="IN_ANGOLA">Em Angola</option>
                      <option value="OUT_FOR_DELIVERY">Saiu para Entrega</option>
                      <option value="DELIVERED">Entregue</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-8 text-white/40">Nenhuma encomenda encontrada</div>
      )}
    </div>
  );
}

// ======================== ADMIN USER LIST ========================
function AdminUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
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
        setUsers(json.data);
      } else {
        setError(json.error || 'Erro ao carregar utilizadores');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (id: string, role: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}/role`, {
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

      fetchUsers();
    } catch (err) {
      alert('Erro ao alterar role');
    }
  };

  if (loading) return <div className="text-center py-8 text-white/60">A carregar utilizadores...</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Nome</th>
              <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm hidden sm:table-cell">Email</th>
              <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm hidden md:table-cell">Telefone</th>
              <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm hidden lg:table-cell">Empresa</th>
              <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Role</th>
              <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{u.name}</td>
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">{u.email}</td>
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">{u.phone || '—'}</td>
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">{u.company || '—'}</td>
                <td className="py-3 px-2 sm:px-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                    u.role === 'ADMIN' ? 'text-gold bg-gold/10' :
                    u.role === 'OPERATOR' ? 'text-lilac-400 bg-lilac-400/10' :
                    'text-white/60 bg-white/10'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-2 sm:px-4">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="px-1 sm:px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] sm:text-xs text-white focus:border-gold outline-none"
                  >
                    <option value="CLIENT">Cliente</option>
                    <option value="OPERATOR">Operador</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======================== ADMIN ROUTE MANAGER ========================
function AdminRouteManager() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRoute, setNewRoute] = useState({
    origin: '',
    destination: '',
    serviceType: 'AIR_EXPRESS',
    pricePerKg: 0,
    flightDate: '',
    capacity: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/routes', {
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
        setError(json.error || 'Erro ao carregar rotas');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingId || undefined,
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
        fetchRoutes();
        setNewRoute({ origin: '', destination: '', serviceType: 'AIR_EXPRESS', pricePerKg: 0, flightDate: '', capacity: 0 });
        setEditingId(null);
      } else {
        alert(json.error || 'Erro ao guardar rota');
      }
    } catch (err) {
      alert('Erro de conexão');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que pretende eliminar esta rota?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/routes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      fetchRoutes();
    } catch (err) {
      alert('Erro ao eliminar');
    }
  };

  const isExpired = (flightDate: string) => {
    return new Date(flightDate) < new Date();
  };

  if (loading) return <div className="text-center py-8 text-white/60">A carregar rotas...</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  return (
    <div>
      <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl mb-6">
        <h4 className="font-semibold mb-4 text-sm sm:text-base">{editingId ? 'Editar Rota' : 'Adicionar Nova Rota'}</h4>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Origem"
            value={newRoute.origin}
            onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
            required
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white text-sm"
          />
          <input
            type="text"
            placeholder="Destino"
            value={newRoute.destination}
            onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
            required
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white text-sm"
          />
          <select
            value={newRoute.serviceType}
            onChange={(e) => setNewRoute({ ...newRoute, serviceType: e.target.value })}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-gold outline-none"
          >
            <option value="AIR_EXPRESS">Air Express</option>
            <option value="AIR_ECONOMY">Air Economy</option>
            <option value="MARITIME">Marítimo</option>
          </select>
          <input
            type="number"
            placeholder="€/kg"
            value={newRoute.pricePerKg || ''}
            onChange={(e) => setNewRoute({ ...newRoute, pricePerKg: parseFloat(e.target.value) || 0 })}
            required
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white text-sm"
          />
          <input
            type="date"
            value={newRoute.flightDate}
            onChange={(e) => setNewRoute({ ...newRoute, flightDate: e.target.value })}
            required
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white text-sm"
          />
          <input
            type="number"
            placeholder="Capacidade (kg)"
            value={newRoute.capacity || ''}
            onChange={(e) => setNewRoute({ ...newRoute, capacity: parseFloat(e.target.value) || 0 })}
            required
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white text-sm"
          />
          <div className="lg:col-span-6 flex gap-2">
            <GoldButton type="submit" className="py-2 px-4 text-sm">
              {editingId ? 'Atualizar' : 'Adicionar'}
            </GoldButton>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setNewRoute({ origin: '', destination: '', serviceType: 'AIR_EXPRESS', pricePerKg: 0, flightDate: '', capacity: 0 }); }}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Origem</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Destino</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm hidden sm:table-cell">Serviço</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">€/kg</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Data do Voo</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm hidden md:table-cell">Capacidade</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm hidden lg:table-cell">Reservado</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Disponível</th>
                <th className="text-left py-3 px-2 sm:px-4 text-white/60 text-xs sm:text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => {
                const expired = isExpired(r.flightDate);
                return (
                  <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${expired ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{r.origin}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{r.destination}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">{r.serviceType.replace('_', ' ')}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">€ {r.pricePerKg}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                      {r.flightDate ? new Date(r.flightDate).toLocaleDateString('pt-PT') : '—'}
                      {expired && <span className="ml-2 text-red-400 text-[10px]">(Expirada)</span>}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">{r.capacity} kg</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">{r.reserved} kg</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">
                      <span className={r.available > 0 ? 'text-green-400' : 'text-red-400'}>
                        {r.available} kg
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingId(r.id);
                            setNewRoute({
                              origin: r.origin,
                              destination: r.destination,
                              serviceType: r.serviceType,
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
        <div className="text-center py-8 text-white/40">Nenhuma rota encontrada</div>
      )}
    </div>
  );
}

// ======================== ADMIN LEADS LIST (MENSAGENS) ========================
function AdminLeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Não autenticado');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/leads', {
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
        setLeads(json.data);
      } else {
        setError(json.error || 'Erro ao carregar mensagens');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/leads/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      fetchLeads();
    } catch (err) {
      alert('Erro ao marcar como lida');
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Tem a certeza que pretende eliminar esta mensagem?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      fetchLeads();
    } catch (err) {
      alert('Erro ao eliminar mensagem');
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
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT');
    } catch {
      return '—';
    }
  };

  if (loading) return <div className="text-center py-8 text-white/60">A carregar mensagens...</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Nenhuma mensagem de contacto recebida.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className={`glass-strong border-gradient p-4 rounded-xl transition-all ${
            lead.read ? 'opacity-60' : 'border-gold/50'
          }`}
        >
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="font-semibold text-white text-sm sm:text-base truncate">{lead.name}</span>
                <span className="text-sm text-white/40 hidden sm:inline">•</span>
                <a href={`mailto:${lead.email}`} className="text-sm text-gold hover:underline truncate">
                  {lead.email}
                </a>
                {lead.phone && (
                  <>
                    <span className="text-sm text-white/40 hidden sm:inline">•</span>
                    <a href={`tel:${lead.phone}`} className="text-sm text-white/60 hover:text-white truncate">
                      {lead.phone}
                    </a>
                  </>
                )}
                <span className="text-xs text-white/30 ml-auto whitespace-nowrap">
                  {formatDateTime(lead.createdAt)}
                </span>
              </div>
              <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap break-words">{lead.message}</div>
              {!lead.read && (
                <div className="mt-1">
                  <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded-full">Nova</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!lead.read && (
                <button
                  onClick={() => markAsRead(lead.id)}
                  className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors whitespace-nowrap"
                >
                  Marcar lida
                </button>
              )}
              <button
                onClick={() => deleteLead(lead.id)}
                className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors whitespace-nowrap"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ======================== MAIN DASHBOARD ========================
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'shipments' | 'users' | 'routes' | 'messages'>('overview');
  const [stats, setStats] = useState({ totalShipments: 0, activeShipments: 0, deliveredToday: 0, totalUsers: 0 });
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Buscar estatísticas
      const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
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
          totalUsers: statsJson.data.totalUsers || 0
        });
      }

      // Buscar encomendas recentes (últimas 5)
      const shipmentsRes = await fetch('http://localhost:5000/api/admin/shipments', {
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
        fetchDashboardData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
    { id: 'shipments', label: 'Encomendas', icon: Package },
    { id: 'users', label: 'Utilizadores', icon: Users },
    { id: 'routes', label: 'Rotas', icon: MapPin },
    { id: 'messages', label: 'Mensagens', icon: Mail },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-24 sm:pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-white flex flex-wrap items-center gap-2">
                  <span className="text-gradient-gold">Dashboard</span>
                  <span className="text-sm text-white/40">Administração</span>
                </h1>
                <p className="text-white/60 mt-1 text-sm sm:text-base">Gerencie encomendas, utilizadores, rotas e mensagens.</p>
              </div>
              <button
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'A atualizar...' : 'Atualizar'}
              </button>
            </div>
          </motion.div>

          {/* Tabs - Desktop */}
          <div className="hidden md:flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gold text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
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
              className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
            >
              <span className="flex items-center gap-2">
                {currentTab && <currentTab.icon className="w-4 h-4" />}
                {currentTab?.label}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileMenuOpen && (
              <div className="mt-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gold/20 text-gold'
                        : 'text-white/60 hover:bg-white/5'
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
                <StatsCards stats={stats} />
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Últimas Encomendas */}
                  <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
                    <h3 className="font-semibold mb-4 text-sm sm:text-base">Últimas Encomendas</h3>
                    <div className="space-y-3">
                      {recentShipments.length === 0 ? (
                        <p className="text-white/40 text-sm">Nenhuma encomenda recente.</p>
                      ) : (
                        recentShipments.map((s) => (
                          <div key={s.id} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                            <div>
                              <div className="font-mono text-xs text-gold">{s.trackingCode}</div>
                              <div className="text-xs text-white/60">{s.origin} → {s.destination}</div>
                              <div className="text-[10px] text-white/40">{formatDate(s.createdAt)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold">€ {s.price?.toFixed(2) || '—'}</div>
                              <div className={`text-[10px] px-2 py-0.5 rounded-full ${s.status === 'DELIVERED' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                                {s.status.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Distribuição por Status */}
                  <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
                    <h3 className="font-semibold mb-4 text-sm sm:text-base">Distribuição por Status</h3>
                    {Object.keys(statusDistribution).length === 0 ? (
                      <p className="text-white/40 text-sm">Nenhuma encomenda.</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(statusDistribution).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-sm text-white/60">{status.replace('_', ' ')}</span>
                            <span className="text-sm font-semibold text-white">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'shipments' && <AdminShipmentList />}
            {activeTab === 'users' && <AdminUserList />}
            {activeTab === 'routes' && <AdminRouteManager />}
            {activeTab === 'messages' && <AdminLeadsList />}
          </div>
        </div>
      </div>
    </Layout>
  );
}