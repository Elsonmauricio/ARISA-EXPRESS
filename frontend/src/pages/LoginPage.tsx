// src/pages/Login.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { GoldButton } from '../components/Button';
import Layout from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../i18n/LanguageContext';
import { api, authenticatedFetch, logout } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isResetMode) {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }

        const response = await fetch(api('/api/auth/reset-password-direct'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password })
        });
        const json = await response.json();

        if (json.success) {
          setError('');
          setIsResetMode(false);
          alert('Senha redefinida com sucesso! Pode fazer login agora.');
        } else {
          setError(json.error || 'Erro ao redefinir senha');
        }
      } else {
        const response = await fetch(api('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const json = await response.json();

        if (json.success) {
          localStorage.setItem('token', json.data.accessToken);
          localStorage.setItem('refreshToken', json.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(json.data.user));
          navigate('/');
        } else {
          setError(json.error || t('login.credenciaisInvalidas'));
        }
      }
    } catch (err) {
      setError(t('login.erroConexao'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-[#E8D9F5] pt-20 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong border-gradient p-8 rounded-2xl">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold text-gold">
                {isResetMode ? 'Redefinir Senha' : t('login.bemVindo')}
              </h2>
               <p className="text-gray-500 mt-2">
                {isResetMode ? 'Insira o seu email e a nova senha' : t('login.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                 <label className="block text-sm text-gray-500 mb-1">{t('login.email')}</label>
                <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gray-800"
                    placeholder={t('login.emailPlaceholder')}
                  />
                </div>
              </div>

              {!isResetMode && (
                <div>
                   <label className="block text-sm text-gray-500 mb-1">{t('login.senha')}</label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gray-800"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gold"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {isResetMode && (
                <div>
                   <label className="block text-sm text-gray-500 mb-1">Nova Senha</label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gray-800"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gold"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {isResetMode && (
                <div>
                   <label className="block text-sm text-gray-500 mb-1">Confirmar Nova Senha</label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 bg-[#E8D9F5] border border-gray-300 rounded-lg focus:border-gold outline-none text-gray-800"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gold"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <GoldButton type="submit" className="w-full text-black py-3" disabled={loading}>
                {loading ? (isResetMode ? 'A processar...' : t('login.entrar')) : (isResetMode ? 'Redefinir Senha' : t('login.botao'))}
              </GoldButton>
            </form>

            <div className="mt-6 text-center text- text-gray-400">
              {isResetMode ? (
                <button onClick={() => setIsResetMode(false)} className="text-gold hover:underline">
                  Voltar para o login
                </button>
              ) : (
                <>
                  {t('login.semConta')}{' '}
                  <Link to="/registar" className="text-gold hover:underline">
                    {t('login.criarConta')}
                  </Link>
                  <div className="mt-2">
                    <button onClick={() => setIsResetMode(true)} className="text-gold hover:underline text-sm">
                      Esqueceu a senha? Redefinir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}


