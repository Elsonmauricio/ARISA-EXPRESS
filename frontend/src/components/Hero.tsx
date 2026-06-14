import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { GoldButton, GhostButton } from './Button';
import { ArrowRight, Package } from 'lucide-react';

const Scene = lazy(() => import('./three/Scene3D'));

const SceneLoader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-12 h-12 rounded-full border-2 border-t-gold border-lilac-500/20 animate-spin" />
  </div>
);

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* 3D Canvas absolute layer */}
      <div className="absolute inset-0 -z-0">
        <Suspense fallback={<SceneLoader />}>
          <Scene />
        </Suspense>
      </div>

      {/* Soft vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/10 to-black/30 z-[1]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black z-[1]" />

      {/* Content overlay */}
      <div className="relative z-10 container min-h-screen flex items-center pt-28 pb-20">
        <div className="max-w-2xl ml-auto md:pl-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs tracking-widest uppercase text-white/80 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-glow" />
            Angola • Portugal — Premium Logistics
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] text-white"
          >
            Ligamos <span className="text-gradient-lilac">Angola</span> a <span className="text-gradient-gold">Portugal</span> com rapidez e segurança.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-6 text-base md:text-lg text-white/70 max-w-xl leading-relaxed"
          >
            Soluções de transporte internacional para particulares e empresas — entregas porta-a-porta, rastreamento em tempo real e atendimento dedicado.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <GoldButton>
              <span className="flex items-center gap-2">Solicitar Orçamento <ArrowRight className="w-4 h-4" /></span>
            </GoldButton>
            <GhostButton>
              <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Acompanhar Encomenda</span>
            </GhostButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }}
            className="mt-12 grid grid-cols-3 gap-6 max-w-md"
          >
            {[
              { v: '48h', l: 'Entrega expressa' },
              { v: '24/7', l: 'Apoio dedicado' },
              { v: '100%', l: 'Rastreável' },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-display text-2xl text-gold font-bold">{s.v}</div>
                <div className="text-xs text-white/60 mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 rounded-full border border-white/20 flex justify-center pt-2">
          <span className="w-1 h-2 rounded-full bg-gold animate-bounce" />
        </div>
      </div>
    </section>
  );
}
