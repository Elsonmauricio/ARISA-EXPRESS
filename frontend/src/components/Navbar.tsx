// src/components/Navbar.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, User, Settings, LogOut, Package, Search } from 'lucide-react';
import { GoldButton } from './Button';
import ARISAEXPRESStLogo from '../assets/logo-Arisa-express.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { scrollToAnchor } from '../lib/scroll';
import { useT } from '../i18n/LanguageContext';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  company?: string;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdowns, setDropdowns] = useState({
    brand: false,
    shipments: false,
    profile: false
  });
  const { t } = useT();

  const BRAND_LINKS = [
    { href: '#sobre', label: t('nav.sobre') },
    { href: '#servicos', label: t('nav.servicos') },
    { href: '#contactos', label: t('nav.contactos') },
  ];
  const SHIPMENT_LINKS = [
    { href: '/encomendas?tab=reservar', label: t('nav.reservar') },
    { href: '/encomendas?tab=consultar', label: t('nav.minhasEncomendas') },
    { href: '/encomendas?tab=rastrear', label: t('nav.rastrear') },
    { href: '/encomendas?tab=tabela', label: t('nav.tabelaPrecos') },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Tentar buscar da API se houver token mas nÃ£o user (fallback)
      const token = localStorage.getItem('token');
      if (token) {
        fetch(api('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setUser(data.data);
              localStorage.setItem('user', JSON.stringify(data.data));
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const toggleDropdown = (name: 'brand' | 'shipments' | 'profile') => {
    setDropdowns((prev) => ({
      brand: false,
      shipments: false,
      profile: false,
      [name]: !prev[name],
    }));
  };

  const goToSection = (hash: string) => {
    const scroll = () => scrollToAnchor(hash);
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for home to mount before scrolling.
      setTimeout(scroll, 350);
    } else {
      scroll();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleProfileAction = (link: any) => {
    if (link.onClick) {
      handleLogout();
    } else {
      navigate(link.href);
    }
    setDropdowns({ ...dropdowns, profile: false });
  };

  // Link para admin (apenas para ADMIN ou OPERATOR)
  const adminLink = user && (user.role === 'ADMIN' || user.role === 'OPERATOR') ? (
    <Link
      to="/admin"
      onClick={() => { setDropdowns({ ...dropdowns, profile: false }); setOpen(false); }}
      className="block px-4 py-2 text-sm text-white/80 hover:text-gold hover:bg-white/5 rounded-lg transition-colors"
    >
      {t('nav.dashboardAdmin')}
    </Link>
  ) : null;

  // Links do perfil (comum)
  const profileLinks = [
    { href: '/perfil', label: t('nav.perfil'), icon: <User className="w-4 h-4" /> },
    { href: '/definicoes', label: t('nav.definicoes'), icon: <Settings className="w-4 h-4" /> },
    { href: '#', label: t('nav.sair'), icon: <LogOut className="w-4 h-4" />, onClick: true },
  ];

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-7 left-0 right-0 z-[9999] transition-all duration-500 max-w-full ${
        scrolled ? 'py-3' : 'py-5'
      }`}
      style={{ zIndex: 9999, isolation: 'isolate' }}
    >
      <div className={`container mx-auto flex items-center justify-between rounded-2xl px-5 md:px-7 py-3 transition-all duration-500 ${
        scrolled ? 'glass-strong' : 'bg-transparent'
      }`}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src={ARISAEXPRESStLogo}
             alt={t('nav.logoAlt')}
              className="h-10 sm:h-14 md:h-16 lg:h-20 w-auto max-w-[70vw] sm:max-w-[50vw] drop-shadow-[0_0_14px_rgba(168,85,247,0.5)] brightness-110 group-hover:brightness-125 transition-all duration-300" width={80} height={80}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {/* Dropdown: Arisa Express */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('brand')}
              className="flex items-center gap-1 text-sm text-white/80 hover:text-gold transition-colors group"
            >
              {t('nav.marca')}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdowns.brand ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                  {dropdowns.brand && (
                 <motion.div
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="absolute left-0 mt-2 glass-strong rounded-xl p-2 min-w-[180px] max-w-[80vw] border border-white/20"
                   style={{ zIndex: 9999 }}
                 >
                  {BRAND_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => { e.preventDefault(); goToSection(link.href); setDropdowns({ brand: false, shipments: false, profile: false }); }}
                      className="block px-4 py-2 text-sm text-white/80 hover:text-gold hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dropdown: Encomendas */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('shipments')}
              className="flex items-center gap-1 text-sm text-white/80 hover:text-gold transition-colors group"
            >
              {t('nav.encomendas')}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdowns.shipments ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                  {dropdowns.shipments && (
                 <motion.div
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="absolute left-0 mt-2 glass-strong rounded-xl p-2 min-w-[180px] max-w-[80vw] border border-white/20"
                   style={{ zIndex: 9999 }}
                 >
                  {SHIPMENT_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setDropdowns({ ...dropdowns, shipments: false })}
                      className="block px-4 py-2 text-sm text-white/80 hover:text-gold hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dropdown: Perfil */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => toggleDropdown('profile')}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-gold transition-colors group"
              >
                <span className="w-8 h-8 rounded-full bg-lilac/20 flex items-center justify-center text-gold font-semibold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdowns.profile ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                  {dropdowns.profile && (
                 <motion.div
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="absolute right-0 mt-2 glass-strong rounded-xl p-2 min-w-[200px] max-w-[80vw] border border-white/20"
                   style={{ zIndex: 9999 }}
                 >
                    {adminLink && (
                      <>
                        {adminLink}
                        <div className="border-t border-white/20 my-2" />
                      </>
                    )}
                    {profileLinks.map((link) => (
                      <button
                        key={link.label}
                        onClick={() => handleProfileAction(link)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-gold hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {link.icon}
                        {link.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm text-white/80 hover:text-gold transition-colors">
                {t('nav.entrar')}
              </Link>
              <GoldButton className="px-5 py-2 text-sm" onClick={() => navigate('/registar')}>
                {t('nav.criarConta')}
              </GoldButton>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button className="md:hidden text-gold" onClick={() => setOpen(!open)} aria-label={t('nav.menu')}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
         {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mx-4 mt-3 glass-strong rounded-2xl p-5 flex flex-col gap-4"
            style={{ zIndex: 9999 }}
          >
            {BRAND_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); goToSection(link.href); setOpen(false); }}
                className="text-white/80 hover:text-gold transition-colors"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-white/20" />
            {SHIPMENT_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-white/20" />
            {user ? (
              <>
                {adminLink && (
                  <>
                    {adminLink}
                    <hr className="border-white/20" />
                  </>
                )}
                 <Link to="/perfil" onClick={() => setOpen(false)} className="text-white/80 hover:text-gold transition-colors">
                   {t('nav.perfil')}
                 </Link>
                 <Link to="/definicoes" onClick={() => setOpen(false)} className="text-white/80 hover:text-gold transition-colors">
                   {t('nav.definicoes')}
                 </Link>
                 <button
                   onClick={() => { handleLogout(); setOpen(false); }}
                   className="text-red-400 hover:text-red-300 text-left"
                 >
                   {t('nav.sair')}
                 </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-white/80 hover:text-gold transition-colors">
                  {t('nav.entrar')}
                </Link>
                <GoldButton className="w-full" onClick={() => { navigate('/registar'); setOpen(false); }}>
                  {t('nav.criarConta')}
                </GoldButton>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}


