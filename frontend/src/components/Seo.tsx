import { useEffect } from 'react';
import { useT } from '../i18n/LanguageContext';

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Arisa Express',
  url: 'https://arisa-express.com',
  logo: 'https://arisa-express.com/logo-Arisa-express.png',
  description: 'Transporte e logística internacional entre Angola e Portugal com rastreio em tempo real.',
  areaServed: ['Angola', 'Portugal'],
  sameAs: [],
};

export default function Seo() {
  const { lang, t } = useT();
  useEffect(() => {
    const title = lang === 'en' ? 'Arisa Express - Connecting Angola and Portugal' : 'Arisa Express - Ligando Angola a Portugal';
    const description = lang === 'en' ? 'International transport and logistics between Angola and Portugal with real-time tracking.' : 'Transporte e logística internacional entre Angola e Portugal com rastreio em tempo real.';
    document.title = title;
    document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.setAttribute('name', 'description'); document.head.appendChild(metaDesc); }
    metaDesc.setAttribute('content', description);
    let ld = document.getElementById('org-jsonld') as HTMLScriptElement | null;
    if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'org-jsonld'; document.head.appendChild(ld); }
    ld.textContent = JSON.stringify(ORG_JSON_LD);
  }, [lang, t]);
  return null;
}



