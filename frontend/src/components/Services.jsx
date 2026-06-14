'use client';

/**
 * Services — 3 cartões premium horizontais.
 * Hover (Framer Motion):
 *  - O cartão levanta ligeiramente (translateY: -8) com scale subtil
 *  - O brilho da borda gradiente lilás/dourado intensifica
 *  - O ícone ganha cor dourada mais vibrante
 *  - Glow radial do fundo fica mais forte
 */

import { motion } from 'framer-motion';
import { Plane, Building2, PackageCheck, ArrowUpRight } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';

const SERVICES = [
  {
    n: '01',
    icon: Plane,
    title: 'Transporte Aéreo',
    desc: 'Cargas urgentes entre Lisboa e Luanda com tempo de trânsito otimizado, manuseamento prioritário e seguro incluído.',
    accent: 'from-lilac-500/40 to-lilac-700/5',
    iconBg: 'bg-lilac-500/10',
  },
  {
    n: '02',
    icon: Building2,
    title: 'Logística Empresarial',
    desc: 'Soluções B2B com gestão de stocks, armazenagem alfandegária e distribuição porta-a-porta em ambos os países.',
    accent: 'from-gold/40 to-gold/0',
    iconBg: 'bg-gold/10',
  },
  {
    n: '03',
    icon: PackageCheck,
    title: 'Encomendas Particulares',
    desc: 'Envios pessoais com recolha em casa, embalagem segura e rastreio em tempo real desde a origem até ao destinatário.',
    accent: 'from-lilac-400/40 to-gold/10',
    iconBg: 'bg-lilac-400/10',
  },
];

function ServiceCard({ s, i }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.015 }}
      className="group relative rounded-3xl overflow-hidden cursor-pointer h-full"
    >
      {/* Camada de borda gradiente (animação de brilho no hover) */}
      <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-lilac-500/40 via-white/5 to-gold/40 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
        <div className="w-full h-full rounded-3xl bg-dark-700/80 backdrop-blur-xl" />
      </div>

      {/* Glow radial atrás do cartão */}
      <div
        className={`pointer-events-none absolute -top-32 -right-24 w-72 h-72 rounded-full bg-gradient-to-br ${s.accent} blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Conteúdo */}
      <div className="relative z-10 p-8 md:p-10 flex flex-col h-full min-h-[340px]">
        <div className="flex items-start justify-between mb-12">
          <span className="font-display text-lg text-white/30 tracking-wider">{s.n}</span>
          <motion.div
            className={`w-14 h-14 rounded-2xl ${s.iconBg} border border-white/10 flex items-center justify-center backdrop-blur-md group-hover:border-gold/60 transition-colors duration-500`}
            whileHover={{ rotate: 6 }}
          >
            <s.icon className="w-7 h-7 text-gold group-hover:text-lilac-200 transition-colors duration-500" />
          </motion.div>
        </div>

        <h3 className="font-display text-2xl font-semibold leading-tight text-white">
          {s.title}
        </h3>
        <p className="mt-3 text-sm text-white/60 leading-relaxed flex-1">
          {s.desc}
        </p>

        <div className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold group-hover:gap-3 transition-all duration-300">
          Saber mais
          <ArrowUpRight className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        </div>
      </div>

      {/* Linha inferior dourada (revela no hover) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent group-hover:w-3/4 transition-all duration-700" />
    </motion.article>
  );
}

export default function Services() {
  return (
    <section id="servicos" className="relative py-28">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <SectionHeading
            eyebrow="O que fazemos"
            title={
              <>
                Serviços{' '}
                <span className="text-gradient-gold">premium</span>{' '}
                de ponta-a-ponta.
              </>
            }
            subtitle="Três pilares para mover o que importa entre Angola e Portugal. Cada solução foi desenhada para um perfil específico — escolha o que se adapta a si."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.n} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
