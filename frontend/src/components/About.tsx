import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { useT } from '../i18n/LanguageContext';

// DefiniÃ§Ã£o de tipos para os pilares
interface Pillar {
  title: string;
  text: string;
}


// Tipagem do componente principal
const About: React.FC = () => {
  const { t } = useT();
  const PILLARS: Pillar[] = [
    { title: t('about.missao'), text: t('about.missaoText') },
    { title: t('about.visao'),  text: t('about.visaoText') },
  ];
  return (
    <section id="sobre" className="relative py-28 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1a1133]/60 via-transparent to-[#1a1133]/30 z-[1]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1a1133]/40 via-transparent to-[#1a1133]/70 z-[1]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_#EFE4FA40,_transparent_70%)]" />

      <div className="container mx-auto max-w-7xl grid lg:grid-cols-1 gap-14 items-center overflow-x-hidden">
        {/* Coluna 1  Texto */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ overflowX: 'hidden' }}
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
                 <h3 className="font-display text-xl font-semibold text-gold">{p.title}</h3>
                 <p className="mt-2 text-sm text-white/70 leading-relaxed">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;


