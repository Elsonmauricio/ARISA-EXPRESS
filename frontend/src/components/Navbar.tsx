import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Plane } from 'lucide-react';
import { GoldButton } from './Button';
import ARISAEXPRESStLogo from '../assets/logo-Arisa-express.png';

const LINKS = [
  { href: '#sobre', label: 'Sobre Nós' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#rastrear', label: 'Rastrear' },
  { href: '#contactos', label: 'Contactos' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div className={`container mx-auto flex items-center justify-between rounded-2xl px-5 md:px-7 py-3 transition-all duration-500 ${
        scrolled ? 'glass-strong' : 'bg-transparent'
      }`}>
        <a href="/" className="flex items-center gap-2.5 group">
          <img src={ARISAEXPRESStLogo} alt="ARISA EXPRESS Logo" className="h-14"/>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-lilac-300">ARISA</span>
            <span className="text-[10px] tracking-[0.35em] text-gold">EXPRESS</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="relative text-sm text-white/80 hover:text-white transition-colors group">
              {l.label}
              <span className="absolute left-0 -bottom-1 w-0 h-px bg-gold group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <GoldButton className="px-5 py-2.5 text-sm">Solicitar Orçamento</GoldButton>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mx-4 mt-3 glass-strong rounded-2xl p-5 flex flex-col gap-4"
          >
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-white/80 hover:text-gold transition-colors">{l.label}</a>
            ))}
            <GoldButton className="mt-2">Solicitar Orçamento</GoldButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
