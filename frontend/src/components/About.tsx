import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, LucideIcon } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';

// Definição de tipos para os pilares
interface Pillar {
  icon: LucideIcon;
  title: string;
  text: string;
}

const PILLARS: Pillar[] = [
  { icon: Target, title: 'Missão', text: 'Tornar o envio internacional simples, transparente e rápido para pessoas e empresas que cruzam Angola e Portugal.' },
  { icon: Eye,    title: 'Visão',  text: 'Ser a referência premium em logística Angola – Portugal até 2030, combinando tecnologia e atendimento humano.' },
];

// Componente 3D com tipagem
// Alterado de next/dynamic para React.lazy para compatibilidade com Vite
const LogisticFlow3D = lazy(() => import('./three/LogisticFlow3D.jsx'));

const Loader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-t-gold border-lilac-500/20 animate-spin" />
  </div>
);

// Tipagem do componente principal
const About: React.FC = () => {
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
            eyebrow="Sobre Nós"
            title={<>Logística pensada para <span className="text-gradient-gold">conectar dois continentes</span>.</>}
            subtitle="Somos a ponte de confiança entre Angola e Portugal. Combinamos rede aérea, infraestrutura de armazenagem e tecnologia de rastreamento para entregar mais do que pacotes — entregamos previsibilidade."
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
                <div className="w-10 h-10 rounded-xl bg-lilac-500/20 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Coluna 2 — Canvas 3D do fluxo logístico */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative aspect-square max-w-xl mx-auto w-full"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_#7C3AED20,_transparent_70%)]" >
            {/* Glows decorativos */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-lilac-500/25 blur-3xl rounded-full pointer-events-none z-0" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-gold/20 blur-3xl rounded-full pointer-events-none z-0" />

            {/* Canvas */}
            <div className="absolute inset-0 z-10">
              <Suspense fallback={<Loader />}>
                <LogisticFlow3D />
              </Suspense>
            </div>

            {/* Label */}
            <div className="absolute bottom-5 left-5 z-20 text-[10px] tracking-[0.35em] uppercase text-white/50">
              Fluxo Logístico • Angola ↔ Portugal
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;