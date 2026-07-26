import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpRight } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, Environment } from '@react-three/drei';
import { Forklift3D } from './three/Forklift3D'; // Assumindo que agora são .tsx
import { Mailbox3D } from './three/Mailbox3D'; // Assumindo que agora são .tsx
import { Shopping3D } from './three/Shopping3D'; // Assumindo que agora são .tsx
import { useT } from '../i18n/LanguageContext';

interface Service {
  n: string;
  component: JSX.Element;
  title: string;
  desc: string;
  accent: string;
  iconBg: string;
}

const getServices = (t: (key: string) => string): Service[] => ([
  {
    n: '1',
    component: <Forklift3D />,
    title: t('services.1.title'),
    desc: t('services.1.desc'),
    accent: 'from-lilac-500/40 to-lilac-700/5',
    iconBg: 'bg-lilac-500/10',
  },
  {
    n: '2',
    component: <Mailbox3D />,
    title: t('services.2.title'),
    desc: t('services.2.desc'),
    accent: 'from-gold/40 to-gold/0',
    iconBg: 'bg-gold/10',
  },
  {
    n: '3',
    component: <Shopping3D />,
    title: t('services.3.title'),
    desc: t('services.3.desc'),
    accent: 'from-lilac-400/40 to-gold/10',
    iconBg: 'bg-lilac-400/10',
  },
]);

const WHATSAPP_NUMBER = '351934292082';

const openWhatsApp = (message: string): void => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message )}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

interface ServiceCardProps {
  s: Service;
  i: number;
}

function ServiceCard({ s, i }: ServiceCardProps): JSX.Element {
  const { t } = useT();
  const waMessage = t('services.waMsg', { title: s.title });
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.015, transition: { duration: 0.3 } }}
      onClick={() => openWhatsApp(waMessage)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWhatsApp(waMessage); } }}
      className="group relative rounded-3xl overflow-hidden cursor-pointer h-full"
    >
      {/* Camada de borda gradiente (animação de brilho no hover) */}
      <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-lilac-500/20 via-white/5 to-gold/20 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
        <div className="w-full h-full rounded-3xl bg-dark-700/80 backdrop-blur-xl" />
      </div>

      {/* Conteúdo */}
       <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full min-h-[360px] sm:min-h-[420px] overflow-hidden">
        {/* Número Dourado Top-Left */}
        <span className="absolute top-6 left-8 font-display text-4xl font-bold text-gold opacity-80">{s.n}</span>

        {/* Figura 3D Canvas */}
        <div className="w-full h-48 mt-4">
          <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Suspense fallback={null}>
              <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                {s.component}
              </Float>
            </Suspense>
            <Environment preset="city" />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
          </Canvas>
        </div>

        <h3 className="font-display text-2xl font-semibold leading-tight text-white mt-6">
          {s.title}
        </h3>
        <p className="mt-3 text-sm text-white/50 leading-relaxed flex-1">
          {s.desc}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold/80 group-hover:text-gold transition-all duration-300">
          {t('services.saberMais')}
          <ArrowUpRight className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        </div>
      </div>

      {/* Linha inferior dourada (revela no hover) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent group-hover:w-3/4 transition-all duration-700" />
    </motion.article>
  );
}

export default function Services(): JSX.Element {
  const { t } = useT();
  return (
    <section id="servicos" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lilac-900/10 via-black to-black opacity-60" />
      
      <div className="container mx-auto">
        {/* Apenas o título, sem a barra de pesquisa */}
         <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-16 break-words">
          {t('services.title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {getServices(t).map((s, i) => (
            <ServiceCard key={s.n} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
