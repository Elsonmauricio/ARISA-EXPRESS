'use client';
import { motion } from 'framer-motion';
import { Mailbox, Plane, Warehouse, Truck, Check } from 'lucide-react';

const STEPS = [
  { icon: Mailbox,   title: 'Recebido em Portugal', desc: 'Hub logístico de Lisboa', date: '10 Jun • 14:20' },
  { icon: Plane,     title: 'Em Trânsito (Voo)',    desc: 'Voo TAP LIS → LAD',       date: '11 Jun • 23:45' },
  { icon: Warehouse, title: 'Chegado a Luanda',     desc: 'Aeroporto 4 de Fevereiro', date: '12 Jun • 08:10' },
  { icon: Truck,     title: 'Saiu para Entrega',    desc: 'Equipa de distribuição local', date: 'Hoje • 09:30' },
];


// Animações sequenciais
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.45,
      delayChildren: 0.2,
    },
  },
};

const dotVariants = {
  hidden: { scale: 0.4, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 220, damping: 18 },
  },
};

const lineVariants = {
  hidden: { scaleX: 0 },
  show: {
    scaleX: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function Timeline({ currentStep = 2 }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative"
    >
      {/* ---------- Desktop (horizontal) ---------- */}
      <div className="hidden md:block">
        {/* Linha base */}
        <div className="absolute top-7 left-[7%] right-[7%] h-px bg-white/10" />

        <div className="grid grid-cols-4 gap-4">
          {STEPS.map((s, i) => {
            const reached = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                {/* Linha colorida acumulativa (entre pontos) */}
                {i > 0 && (
                  <motion.div
                    variants={lineVariants}
                    className={`absolute top-7 right-1/2 w-full h-px origin-right ${
                      reached ? 'bg-gradient-to-l from-gold to-lilac-500' : 'bg-transparent'
                    }`}
                  />
                )}

                {/* Ponto */}
                <motion.div
                  variants={dotVariants}
                  className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-colors ${
                    isCurrent
                      ? 'border-gold bg-gold/20 shadow-gold animate-glow'
                      : reached
                        ? 'border-lilac-400 bg-lilac-500/20'
                        : 'border-white/15 bg-white/[0.03]'
                  }`}
                >
                  {reached && !isCurrent ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <s.icon
                      className={`w-5 h-5 ${
                        isCurrent ? 'text-gold' : reached ? 'text-white' : 'text-white/30'
                      }`}
                    />
                  )}
                </motion.div>

                {/* Texto */}
                <motion.div variants={contentVariants} className="mt-4 px-2">
                  <div
                    className={`text-sm font-semibold ${
                      isCurrent ? 'text-gold' : reached ? 'text-white' : 'text-white/40'
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-xs text-white/50 mt-1">{s.desc}</div>
                  <div className="text-[10px] tracking-widest uppercase text-white/30 mt-1">
                    {s.date}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Mobile (vertical) ---------- */}
      <div className="md:hidden relative pl-10">
        <div className="absolute left-[1.6rem] top-2 bottom-2 w-px bg-white/10" />
        {STEPS.map((s, i) => {
          const reached = i <= currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={i} className="relative pb-8 last:pb-0">
              <motion.div
                variants={dotVariants}
                className={`absolute -left-[1.65rem] top-0 w-11 h-11 rounded-full flex items-center justify-center border-2 ${
                  isCurrent
                    ? 'border-gold bg-gold/20 shadow-gold animate-glow'
                    : reached
                      ? 'border-lilac-400 bg-lilac-500/20'
                      : 'border-white/15 bg-white/[0.03]'
                }`}
              >
                {reached && !isCurrent ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <s.icon
                    className={`w-4 h-4 ${
                      isCurrent ? 'text-gold' : reached ? 'text-white' : 'text-white/30'
                    }`}
                  />
                )}
              </motion.div>
              <motion.div variants={contentVariants} className="ml-4">
                <div
                  className={`font-semibold text-sm ${
                    isCurrent ? 'text-gold' : reached ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {s.title}
                </div>
                <div className="text-xs text-white/50">{s.desc}</div>
                <div className="text-[10px] tracking-widest uppercase text-white/30 mt-0.5">
                  {s.date}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
