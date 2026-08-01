// src/pages/Login.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { GoldButton } from '../components/Button';
import Layout from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../i18n/LanguageContext';
import { api } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(api('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await response.json();

      if (json.success) {
        localStorage.setItem('token', json.data.token);
        localStorage.setItem('user', JSON.stringify(json.data.user));
        navigate('/');
      } else {
        setError(json.error || t('login.credenciaisInvalidas'));
      }
    } catch (err) {
      setError(t('login.erroConexao'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-[#D8B9FF] pt-20 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong border-gradient p-8 rounded-2xl">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold text-gold">{t('login.bemVindo')}</h2>
               <p className="text-gold/70 mt-2">{t('login.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                 <label className="block text-sm text-gold/70 mb-1">{t('login.email')}</label>
                <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#D8B9FF] border border-[#D8B9FF]/30 rounded-lg focus:border-gold outline-none text-gold"
                    placeholder={t('login.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                 <label className="block text-sm text-gold/70 mb-1">{t('login.senha')}</label>
                <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-[#D8B9FF] border border-[#D8B9FF]/30 rounded-lg focus:border-gold outline-none text-gold"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/60 hover:text-gold"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <GoldButton type="submit" className="w-full py-3" disabled={loading}>
                {loading ? t('login.entrar') : t('login.botao')}
              </GoldButton>
            </form>

            <div className="mt-6 text-center text-sm text-gold/50">
              {t('login.semConta')}{' '}
              <Link to="/registar" className="text-gold hover:underline">
                {t('login.criarConta')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}


