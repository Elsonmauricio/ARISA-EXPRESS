import React, { Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Lazy3D } from './Lazy3D';
import { Forklift3D } from './three/Forklift3D';
import { Mailbox3D } from './three/Mailbox3D';
import { Shopping3D } from './three/Shopping3D';
import { useT } from '../i18n/LanguageContext';
import { whatsappUrl } from '../lib/utils';

interface Service {
  id: string;
  component: JSX.Element;
  title: string;
  description: string;
  accent: string;
  iconBg: string;
}

const getServices = (t: (key: string) => string): Service[] => ([
  {
    id: '1',
    component: <Forklift3D />,
    title: t('services.1.title'),
    description: t('services.1.desc'),
    accent: 'from-lilac-500/40 to-lilac-700/5',
    iconBg: 'bg-lilac-500/10',
  },
  {
    id: '2',
    component: <Mailbox3D />,
    title: t('services.2.title'),
    description: t('services.2.desc'),
    accent: 'from-gold/40 to-gold/0',
    iconBg: 'bg-gold/10',
  },
  {
    id: '3',
    component: <Shopping3D />,
    title: t('services.3.title'),
    description: t('services.3.desc'),
    accent: 'from-lilac-400/40 to-gold/10',
    iconBg: 'bg-lilac-400/10',
  },
]);

const openWhatsApp = (message: string): void => {
  window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
};

function ServiceCard({ s, i }: { s: Service; i: number }): JSX.Element {
  const { t } = useT();
  const waMessage = t('services.waMsg', { title: s.title });
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 40, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.015, transition: { duration: 0.3 } }}
      onClick={() => openWhatsApp(waMessage)}
      className="group relative rounded-3xl overflow-hidden cursor-pointer h-full text-left"
    >
      {/* Camada de borda gradiente (animação de brilho no hover) */}
      <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-lilac-500/20 via-lilac/5 to-gold/20 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
        <div className="w-full h-full rounded-3xl bg-white/80 backdrop-blur-xl" />
      </div>

      {/* Conteúdo */}
       <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full min-h-[360px] sm:min-h-[420px] overflow-hidden">
         {/* Número Dourado Top-Left */}
         <span className="absolute top-4 sm:top-6 left-4 sm:left-8 font-display text-3xl sm:text-4xl font-bold text-gold opacity-80">{s.id}</span>

        {/* Figura 3D Canvas */}
        <div className="w-full h-40 sm:h-48 mt-4">
          <Lazy3D
            camera={{ position: [0, 0, 4], fov: 40 }}
            className="w-full h-full"
          >
            {s.component}
          </Lazy3D>
        </div>

        <h3 className="font-display text-xl sm:text-2xl font-semibold leading-tight text-gold mt-4 sm:mt-6">
          <span className="text-gradient-lilac">{s.title}</span>
        </h3>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed flex-1">
          {s.description}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gray-700 group-hover:text-gold transition-all duration-300">
          {t('services.saberMais')}
          <ArrowUpRight className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        </div>
      </div>

      {/* Linha inferior dourada (revela no hover) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent group-hover:w-3/4 transition-all duration-700" />
    </motion.button>
  );
}

export default function Services(): JSX.Element {
  const { t } = useT();
  const services = useMemo(() => getServices(t), [t]);
  return (
    <section id="servicos" className="relative py-28 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#E8D9F5]/0 via-transparent to-[#E8D9F5]/10 z-[1]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#E8D9F5]/0 via-transparent to-[#E8D9F5]/20 z-[1]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lilac-900/10 via-lilac/20 to-lilac/20 opacity-60" />
      
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Apenas o título, sem a barra de pesquisa */}
         <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-gold mb-16 break-words">
          <span className="text-gradient-lilac">{t('services.title')}</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <ServiceCard key={s.id} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}



