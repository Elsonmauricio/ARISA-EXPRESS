// src/pages/Register.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { GoldButton } from '../components/Button';
import Layout from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../i18n/LanguageContext';
import { api } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useT();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.senhasCoincidir'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(api('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });
      const json = await response.json();

      if (json.success) {
        localStorage.setItem('token', json.data.token);
        localStorage.setItem('user', JSON.stringify(json.data.user));
        navigate('/');
      } else {
        setError(json.error || t('register.erroRegistar'));
      }
    } catch (err) {
      setError(t('register.erroConexao'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-[#1a1133] pt-20 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong border-gradient p-8 rounded-2xl">
             <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold text-gold">{t('register.titulo')}</h2>
              <p className="text-white/70 mt-2">{t('register.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">{t('register.nome')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#2b1f4a] border border-white/20 rounded-lg focus:border-gold outline-none text-white/90"
                    placeholder={t('register.nomePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">{t('register.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#2b1f4a] border border-white/20 rounded-lg focus:border-gold outline-none text-white/90"
                    placeholder={t('login.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">{t('register.telefone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#2b1f4a] border border-white/20 rounded-lg focus:border-gold outline-none text-white/90"
                    placeholder={t('register.telefonePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">{t('register.senha')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 bg-[#2b1f4a] border border-white/20 rounded-lg focus:border-gold outline-none text-white/90"
                    placeholder={t('register.senhaPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-gold"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">{t('register.confirmarSenha')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#2b1f4a] border border-white/20 rounded-lg focus:border-gold outline-none text-white/90"
                    placeholder={t('register.confirmarSenhaPlaceholder')}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <GoldButton type="submit" className="w-full py-3" disabled={loading}>
                {loading ? t('register.aRegistar') : t('register.botao')}
              </GoldButton>
            </form>

            <div className="mt-6 text-center text-sm text-white/50">
              {t('register.temConta')}{' '}
              <Link to="/login" className="text-gold hover:underline">
                {t('register.iniciarSessao')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}


