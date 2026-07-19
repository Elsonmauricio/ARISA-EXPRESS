import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, LucideIcon } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import { useT } from '../i18n/LanguageContext';

// Definição de tipos para os pilares
interface Pillar {
  title: string;
  text: string;
}

const LogisticFlow3D = lazy(() => import('./three/LogisticFlow3D.jsx'));

const Loader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-t-gold border-lilac-500/20 animate-spin" />
  </div>
);

// Tipagem do componente principal
const About: React.FC = () => {
  const { t } = useT();
  const PILLARS: Pillar[] = [
    { title: t('about.missao'), text: t('about.missaoText') },
    { title: t('about.visao'),  text: t('about.visaoText') },
  ];
  return (
    <section id="sobre" className="relative py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_#7C3AED20,_transparent_70%)]" />

      <div className="container mx-auto grid lg:grid-cols-2 gap-14 items-center">
        {/* Coluna 1 — Texto */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <SectionHeading
            eyebrow={t('about.eyebrow')}
            title={t('about.title')}
            subtitle={t('about.text')}
          />
          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            {PILLARS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-2xl p-6 border-gradient"
              >
                <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;