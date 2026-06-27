// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, Truck, Users, TrendingUp,
  AlertCircle, CheckCircle2, Clock, XCircle,
  Search, Plus, Edit, Trash2, MapPin,
  ChevronDown, Calendar
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
  createdAt: string;
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
  capacity: number;
  reserved: number;
  available: number;
  serviceType: string;
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

// ======================== STATUS CHART ========================
function StatusChart({ shipments }: { shipments: Shipment[] }) {
  const statusCounts: Record<string, number> = {};
  shipments.forEach(s => {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  });

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    COLLECTED: 'bg-blue-500',
    IN_TRANSIT: 'bg-lilac-500',
    CUSTOMS: 'bg-orange-500',
    IN_PORTUGAL: 'bg-cyan-500',
    IN_ANGOLA: 'bg-emerald-500',
    OUT_FOR_DELIVERY: 'bg-purple-500',
    DELIVERED: 'bg-green-500',
    CANCELLED: 'bg-red-500'
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendente',
    COLLECTED: 'Recolhida',
    IN_TRANSIT: 'Em Trânsito',
    CUSTOMS: 'Alfândega',
    IN_PORTUGAL: 'Em Portugal',
    IN_ANGOLA: 'Em Angola',
    OUT_FOR_DELIVERY: 'Saiu para Entrega',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelada'
  };

  const total = shipments.length || 1;

  return (
    <div className="space-y-3">
      {Object.entries(statusCounts).map(([status, count]) => {
        const percentage = (count / total) * 100;
        return (
          <div key={status} className="flex items-center gap-2">
            <span className="text-xs text-white/60 w-28 sm:w-32 truncate">
              {statusLabels[status] || status.replace('_', ' ')}
            </span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${statusColors[status] || 'bg-white/20'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-white/60 w-8 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ======================== RECENT SHIPMENTS ========================
function RecentShipments({ shipments }: { shipments: Shipment[] }) {
  const recent = shipments.slice(0, 5);

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

  if (recent.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhuma encomenda registada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((s) => (
        <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
          <div>
            <div className="font-mono text-xs text-gold">{s.trackingCode}</div>
            <div className="text-xs text-white/60">{s.origin} → {s.destination}</div>
            <div className="text-xs text-white/40">{new Date(s.createdAt).toLocaleDateString('pt-PT')}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">€ {s.price?.toFixed(2) || '—'}</div>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(s.status)}`}>
              {s.status.replace('_', ' ')}
            </div>
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

  useEffect(() => {
    fetchShipments();
  }, []);

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
      const json = await response.json();
      if (json.success) {
        setShipments(json.data);
      } else {
        setError(json.error || 'Erro ao carregar encomendas');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  const changeRole = async (id: string, role: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
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

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/routes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      await fetch(`http://localhost:5000/api/routes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchRoutes();
    } catch (err) {
      alert('Erro ao eliminar');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const isExpired = (flightDate: string) => {
    if (!flightDate) return false;
    try {
      return new Date(flightDate) < new Date();
    } catch {
      return false;
    }
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
              {editingId ? 'Atualizar' : 'Adicionar Rota'}
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
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-white/30" />
                        {formatDate(r.flightDate)}
                        {expired && <span className="ml-1 text-red-400 text-[10px]">(Expirada)</span>}
                      </div>
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

// ======================== MAIN DASHBOARD ========================
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'shipments' | 'users' | 'routes'>('overview');
  const [stats, setStats] = useState({ totalShipments: 0, activeShipments: 0, deliveredToday: 0, totalUsers: 0 });
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      const token = localStorage.getItem('token');
      if (!token) return;

      // Buscar estatísticas
      const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setStats({
          totalShipments: statsJson.data.totalShipments || 0,
          activeShipments: statsJson.data.activeShipments || 0,
          deliveredToday: 0,
          totalUsers: statsJson.data.totalUsers || 0
        });
      }

      // Buscar todas as encomendas para os gráficos
      const shipmentsRes = await fetch('http://localhost:5000/api/admin/shipments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const shipmentsJson = await shipmentsRes.json();
      if (shipmentsJson.success) {
        setShipments(shipmentsJson.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
    { id: 'shipments', label: 'Encomendas', icon: Package },
    { id: 'users', label: 'Utilizadores', icon: Users },
    { id: 'routes', label: 'Rotas', icon: MapPin },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black pt-28 pb-20 px-4 flex items-center justify-center">
          <div className="text-white/60">A carregar dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-24 sm:pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-white flex flex-wrap items-center gap-2">
              <span className="text-gradient-gold">Dashboard</span>
              <span className="text-sm text-white/40">Administração</span>
            </h1>
            <p className="text-white/60 mt-1 text-sm sm:text-base">Gerencie encomendas, utilizadores e rotas.</p>
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
                  <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
                    <h3 className="font-semibold mb-4 text-sm sm:text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gold" />
                      Últimas Encomendas
                    </h3>
                    <RecentShipments shipments={shipments} />
                  </div>
                  <div className="glass-strong border-gradient p-4 sm:p-6 rounded-2xl">
                    <h3 className="font-semibold mb-4 text-sm sm:text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gold" />
                      Distribuição por Status
                    </h3>
                    <StatusChart shipments={shipments} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'shipments' && <AdminShipmentList />}
            {activeTab === 'users' && <AdminUserList />}
            {activeTab === 'routes' && <AdminRouteManager />}
          </div>
        </div>
      </div>
    </Layout>
  );
}