'use client';
import { motion } from 'framer-motion';
import { Search, ArrowUpRight } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, Environment } from '@react-three/drei';
import Plane3D from './three/Plane.jsx';
import Forklift3D from './three/Forklift3D.jsx';
import Mailbox3D from './three/Mailbox3D.jsx';

const SERVICES = [
  {
    n: '1',
    component: <Plane3D scale={15} rotation={[0, Math.PI / 1.5, 0]} />,
    title: 'Transporte Aéreo',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do enusmod.',
    accent: 'from-lilac-500/40 to-lilac-700/5',
    iconBg: 'bg-lilac-500/10',
  },
  {
    n: '2',
    component: <Forklift3D />,
    title: 'Logística Empresarial',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do nonumy nibh.',
    accent: 'from-gold/40 to-gold/0',
    iconBg: 'bg-gold/10',
  },
  {
    n: '3',
    component: <Mailbox3D />,
    title: 'Encomendas Particulares',
    desc: 'Lorem ipsum dolor sit amet, consestetur adipiscing elit, sed do nonuiny nibh.',
    accent: 'from-lilac-400/40 to-gold/10',
    iconBg: 'bg-lilac-400/10',
  },
];

function ServiceCard({ s, i }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.015, transition: { duration: 0.3 } }}
      className="group relative rounded-3xl overflow-hidden cursor-pointer h-full"
    >
      {/* Camada de borda gradiente (animação de brilho no hover) */}
      <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-lilac-500/20 via-white/5 to-gold/20 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
        <div className="w-full h-full rounded-3xl bg-dark-700/80 backdrop-blur-xl" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 p-8 flex flex-col h-full min-h-[420px]">
        {/* Número Dourado Top-Left */}
        <span className="absolute top-6 left-8 font-display text-4xl font-bold text-gold opacity-80">{s.n}</span>

        {/* Figura 3D Canvas */}
        <div className="w-full h-48 mt-4">
          <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              {s.component}
            </Float>
            <Environment preset="city" />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>

        <h3 className="font-display text-2xl font-semibold leading-tight text-white mt-6">
          {s.title}
        </h3>
        <p className="mt-3 text-sm text-white/50 leading-relaxed flex-1">
          {s.desc}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold/80 group-hover:text-gold transition-all duration-300">
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
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lilac-900/10 via-black to-black opacity-60" />
      
      <div className="container mx-auto">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <h2 className="font-display text-5xl md:text-6xl font-bold text-white">
            Serviços
          </h2>
          
          {/* Barra de Pesquisa */}
          <div className="relative w-full max-w-sm group">
            <div className="absolute inset-0 bg-gradient-to-r from-lilac-500/20 to-gold/20 rounded-full blur group-focus-within:opacity-100 opacity-0 transition-opacity" />
            <div className="relative flex items-center bg-dark-800/80 border border-white/10 rounded-full px-5 py-3 transition-all focus-within:border-gold/50">
              <Search className="w-4 h-4 text-white/30 mr-3" />
              <input 
                type="text" 
                placeholder="Insira o código"
                className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full"
              />
            </div>
          </div>
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
