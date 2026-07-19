// src/components/Footer.tsx
import {
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SiInstagram } from 'react-icons/si';
import ARISAEXPRESStLogo from '../assets/logo-Arisa-express.png';
import { Link } from 'react-router-dom';
import { useT } from '../i18n/LanguageContext';

export default function Footer() {
  const { t } = useT();
  const QUICK_LINKS = [
    { label: t('footer.sobre'), href: '#sobre' },
    { label: t('footer.servicos'), href: '#servicos' },
    { label: t('footer.rastrear'), href: '#rastrear' },
    { label: t('footer.contactos'), href: '#contactos' },
  ];

  const SOCIALS = [
    { Icon: SiInstagram, label: t('footer.instagram'), href: '#' },
  ];

  const LEGAL = [
    { label: t('footer.termos'), href: '/termos' },
    { label: t('footer.privacidade'), href: '/privacidade' },
  ];
  return (
    <footer id="footer" className="relative pt-24 pb-10 border-t border-white/5">
      {/* Linha decorativa lilás */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-lilac-500/60 to-transparent" />
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[40%] h-40 bg-lilac-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 pb-14">
          {/* 1. Brand – LOGO MAIOR E COM TEXTO */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img
                src={ARISAEXPRESStLogo}
                 alt={t('nav.logoAlt')}
                className="h-20 w-auto object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
            <p className="text-sm text-white/55 leading-relaxed max-w-xs">
              A ponte premium entre Angola e Portugal. Logística com
              <span className="text-lilac-300"> elegância</span> e
              <span className="text-gold"> precisão</span>.
            </p>
          </div>

          {/* 2. Quick Links */}
          <div>
            <div className="text-sm font-semibold mb-5 text-white tracking-wide">{t('footer.quickLinks')}</div>
            <ul className="space-y-3 text-sm text-white/60">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="inline-flex items-center gap-2 hover:text-lilac-300 transition-colors group"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-lilac-400 transition-colors" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Contactos */}
          <div>
            <div className="text-sm font-semibold mb-5 text-white tracking-wide">{t('footer.contactosTitle')}</div>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-lilac-300 shrink-0" />
                {t('footer.localizacao')}
              </li>
              <li>
                <a href="tel:+351934292082" className="flex items-center gap-2 hover:text-lilac-300 transition-colors">
                  <Phone className="w-4 h-4 text-lilac-300" /> +351 934 292 082
                </a>
              </li>
              <li>
                <a href="mailto:arisaexpress7@gmail.com" className="flex items-center gap-2 hover:text-lilac-300 transition-colors">
                  <Mail className="w-4 h-4 text-lilac-300" /> arisaexpress7@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* 4. Social + Legal */}
          <div>
            <div className="text-sm font-semibold mb-5 text-white tracking-wide">{t('footer.redes')}</div>
            <div className="flex gap-3 mb-7">
              {SOCIALS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className={cn(
                    "group w-10 h-10 rounded-full glass flex items-center justify-center border border-white/10",
                    "hover:border-lilac-400 hover:bg-lilac-500/20 transition-all duration-300"
                  )}
                >
                  <Icon className="w-4 h-4 text-white/70 group-hover:text-lilac-300 transition-colors duration-300" />
                </a>
              ))}
            </div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-3">{t('footer.legal')}</div>
                <ul className="space-y-2 text-xs text-white/50">
                {LEGAL.map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="hover:text-gold transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
          </div>
        </div>

        {/* Linha final */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <div>© {new Date().getFullYear()} {t('footer.copyright')}</div>
          <div>
            {t('footer.feitoCom')} <span className="text-lilac-300">💜</span> entre{' '}
            <span className="text-lilac-300">{t('contact.luanda')}</span> e{' '}
            <span className="text-gold">{t('contact.lisboa')}</span>.
          </div>
        </div>
      </div>
    </footer>
  );
}