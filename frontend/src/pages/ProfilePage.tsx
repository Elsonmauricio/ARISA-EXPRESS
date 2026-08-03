// src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoldButton } from '../components/Button';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/LanguageContext';
import { api } from '../lib/api';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: ''
  });
  const { t } = useT();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(api('/api/users/profile'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (json.success) {
        setUser(json.data);
        setFormData({
          name: json.data.name || '',
          phone: json.data.phone || '',
          company: json.data.company || ''
        });
      } else {
        setError(t('profile.erroCarregar'));
      }
    } catch (err) {
      setError(t('profile.erroConexao'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(api('/api/users/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await response.json();
      if (json.success) {
        setSuccess(t('profile.sucesso'));
        // Atualizar dados locais
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...formData }));
      } else {
        setError(json.error || t('profile.erroAtualizar'));
      }
    } catch (err) {
      setError(t('profile.erroConexao'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#1a1133]">
          <div className="text-white/60">{t('profile.aCarregar')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#1a1133] pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white/90 mb-2">
              <span className="text-gradient-gold">{t('profile.titulo')}</span>
            </h1>
              <p className="text-white/70 mb-8">{t('profile.subtitle')}</p>

            <div className="glass-strong border-gradient p-8 rounded-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-white/70 mb-1">{t('profile.nome')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-[#2b1f4a] border border-white/20 rounded-lg focus:border-gold outline-none text-white/90"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">{t('profile.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-[#2b1f4a] border border-white/20 rounded-lg outline-none text-white/50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-white/40 mt-1">{t('profile.emailFixo')}</p>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">{t('profile.telefone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-[#2b1f4a] border border-white/20 rounded-lg focus:border-gold outline-none text-white/90"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">{t('profile.empresa')}</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-[#2b1f4a] border border-white/20 rounded-lg focus:border-gold outline-none text-white/90"
                      placeholder={t('profile.empresaPlaceholder')}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 p-3 rounded-lg">
                    <CheckCircle2 size={16} /> {success}
                  </div>
                )}

                <GoldButton type="submit" className="w-full text-black py-3" disabled={loading}>
                  {loading ? t('profile.aGuardar') : t('profile.guardar')}
                </GoldButton>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}


