// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Bell, Shield, Moon, Sun, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoldButton } from '../components/Button';
import Layout from '../components/Layout';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const json = await response.json();
      if (json.success) {
        setSuccess(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.error || 'Erro ao alterar senha');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl font-bold text-white mb-2">Definições</h1>
            <p className="text-white/60 text-sm mb-6">Gerencie as suas preferências e segurança</p>

            {success && (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-lg mb-4">
                <CheckCircle2 size={18} /> Senha alterada com sucesso!
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg mb-4">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {/* Alterar Senha */}
            <div className="glass-strong border-gradient p-6 rounded-2xl mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-gold" /> Alterar Senha
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Senha atual</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Nova senha</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-gold outline-none text-white"
                  />
                </div>
                <GoldButton type="submit" className="w-full" disabled={loading}>
                  {loading ? 'A alterar...' : 'Alterar Senha'}
                </GoldButton>
              </form>
            </div>

            {/* Preferências */}
            <div className="glass-strong border-gradient p-6 rounded-2xl mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-gold" /> Preferências
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Notificações por email</span>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-gold' : 'bg-white/20'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Modo escuro</span>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-gold' : 'bg-white/20'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="glass-strong border-gradient p-6 rounded-2xl">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-gold" /> Ações
              </h2>
              <div className="space-y-2">
                <Link to="/perfil" className="block text-sm text-gold hover:underline">
                  Voltar ao Perfil
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    navigate('/');
                  }}
                  className="block text-sm text-red-400 hover:underline"
                >
                  Terminar Sessão
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}