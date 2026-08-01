// src/pages/Terms.tsx
import Layout from '../components/Layout';
import { useT } from '../i18n/LanguageContext';

export default function Terms() {
  const { t } = useT();
  return (
    <Layout>
      <div className="min-h-screen bg-[#1a1133] pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gold mb-8">
            <span className="text-gradient-gold">{t('terms.titulo')}</span>
          </h1>
          <div className="glass-strong border-gradient p-8 rounded-2xl text-white/80 space-y-6">
            <p className="text-sm text-white/60">{t('terms.atualizado', { date: new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) })}</p>

            <h2 className="text-xl font-semibold text-gold">{t('terms.s1')}</h2>
            <p>
              <strong>{t('terms.empresa')}</strong><br />
              {t('terms.nif')}<br />
              {t('terms.morada')}<br />
              {t('terms.contacto')}
            </p>

            <h2 className="text-xl font-semibold text-gold">{t('terms.s2')}</h2>
            <p>{t('terms.s2text')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('terms.serv1')}</li>
              <li>{t('terms.serv2')}</li>
              <li>{t('terms.serv3')}</li>
            </ul>

            <h2 className="text-xl font-semibold text-gold">{t('terms.s3')}</h2>
            <p>{t('terms.s3text')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('terms.pag1')}</li>
              <li>{t('terms.pag2')}</li>
              <li>{t('terms.pag3')}</li>
              <li>{t('terms.pag4')}</li>
            </ul>

            <h2 className="text-xl font-semibold text-gold">{t('terms.s4')}</h2>
            <p>{t('terms.s4text')}</p>

            <h2 className="text-xl font-semibold text-gold">{t('terms.s5')}</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('terms.s5t1')}</li>
              <li>{t('terms.s5t2')}</li>
            </ul>
            <p className="text-sm text-white/60">{t('terms.s5nota')}</p>

            <h2 className="text-xl font-semibold text-gold">{t('terms.s6')}</h2>
            <p>{t('terms.s6text')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('terms.r1')}</li>
              <li>{t('terms.r2')}</li>
              <li>{t('terms.r3')}</li>
              <li>{t('terms.r4')}</li>
            </ul>

            <h2 className="text-xl font-semibold text-gold">{t('terms.s7')}</h2>
            <p>{t('terms.s7t1')}</p>
            <p>{t('terms.s7t2')}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}


