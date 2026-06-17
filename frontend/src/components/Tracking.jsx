'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import { GoldButton } from './Button';
import Timeline from './Timeline';

export default function Tracking() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const value = code.trim();
    if (!value) {
      setError('Insira um código de rastreio.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/tracking/${value.toUpperCase()}`);
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
  }

  return (
    <section id="rastrear" className="relative py-28 min-h-screen flex flex-col justify-center">
      <div className="container mx-auto max-w-5xl px-4">
        <SectionHeading
          align="center"
          eyebrow="Rastreamento"
          title={
            <>
              Onde está a sua <span className="text-gradient-lilac">encomenda</span>?
            </>
          }
          subtitle="Insira o código de rastreio para acompanhar cada etapa da entrega em tempo real."
        />

        {/* Formulário central */}
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
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError('');
              }}
              placeholder="Insira o código (ex. AE-2025-09832)"
              className="flex-1 bg-transparent outline-none px-2 py-2 text-sm placeholder:text-white/30 text-white"
            />
            <GoldButton type="submit" className="px-5 py-2.5 text-sm" disabled={loading}>
              {loading ? '...' : 'Rastrear'}
            </GoldButton>
          </div>

          {/* Erro */}
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

        {/* Resultado + Timeline */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.trackingCode}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="mt-14 glass-strong rounded-3xl p-8 md:p-12 border-gradient"
            >
              {/* Header do resultado */}
              <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-1">
                    Código de Rastreio
                  </div>
                  <div className="font-display text-2xl md:text-3xl text-white">
                    {result.trackingCode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">
                    Estado atual
                  </div>
                  <div className="text-gold font-semibold">
                    {result.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Mapeamos o progresso vindo do backend para o índice do Timeline */}
              <Timeline 
                currentStep={result.progress >= 100 ? 3 : result.progress >= 70 ? 2 : result.progress >= 40 ? 1 : 0} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
