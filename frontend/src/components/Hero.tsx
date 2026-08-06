// src/components/Hero.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AeroButton } from './AeroButton';
import { ArrowRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { scrollToAnchor } from '../lib/scroll';
import { useT } from '../i18n/LanguageContext';

export default function Hero() {
  const navigate = useNavigate();
  const { t } = useT();

  // Função para scroll suave até uma secção
  const scrollToSection = (sectionId: string) => {
    scrollToAnchor(sectionId);
  };

  return (
<section className="relative min-h-screen text-purple-dark flex items-center">
      {/* Soft vignette – light lavender so the 3D scene stays visible behind */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1a1133]/0 via-transparent to-[#E8D9F5]/0 z-[1]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1a1133]/0 via-transparent to-[#E8D9F5]/0 z-[1]" />

      {/* Content overlay */}
      <div className="relative z-10 container mx-auto min-h-screen flex items-center justify-center sm:items-start sm:justify-end pt-32 sm:pt-40 pb-20 px-4">
        <div className="max-w-2xl text-center sm:text-right flex flex-col items-center sm:items-end">

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] text-lilac-500/2 max-w-full"
          >
            {t('hero.title', { angola: t('hero.angola'), portugal: t('hero.portugal') })}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-6 text-base md:text-lg text-[#4B2170] max-w-xl leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            {/* Botão Solicitar Orçamento → rola para a seção de contacto */}
            <AeroButton onClick={() => scrollToSection('contactos')} icon={<ArrowRight className="w-4 h-4" />}>{t('hero.solicitarOrcamento')}</AeroButton>

            {/* Botão Acompanhar Encomenda → navega para a página de encomendas (aba rastrear) */}
            <AeroButton variant="ghost" onClick={() => navigate('/encomendas?tab=rastrear')} icon={<Package className="w-4 h-4" />}>{t('hero.acompanharEncomenda')}</AeroButton>
          </motion.div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 rounded-full border border-gray-300 flex justify-center pt-2">
          <span className="w-1 h-2 rounded-full bg-gold animate-bounce" />
        </div>
      </div>
    </section>
  );
}


