// src/pages/Privacy.tsx
import Layout from '../components/Layout';
import { useT } from '../i18n/LanguageContext';

export default function Privacy() {
  const { t } = useT();
  return (
    <Layout>
      <div className="min-h-screen bg-[#D8B9FF] pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gold mb-8">
            <span className="text-gradient-gold">{t('privacy.titulo')}</span>
          </h1>
          <div className="glass-strong border-gradient p-8 rounded-2xl text-gold/80 space-y-6">
            <p className="text-sm text-gold/60">{t('privacy.atualizado', { date: new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) })}</p>

            <h2 className="text-xl font-semibold text-gold">{t('privacy.s1')}</h2>
            <p>
              <strong>{t('privacy.empresa')}</strong><br />
              {t('privacy.nif')}<br />
              {t('privacy.morada')}<br />
              {t('privacy.contacto')}
            </p>

            <h2 className="text-xl font-semibold text-gold">{t('privacy.s2')}</h2>
            <p>{t('privacy.s2text')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('privacy.d1')}</li>
              <li>{t('privacy.d2')}</li>
              <li>{t('privacy.d3')}</li>
              <li>{t('privacy.d4')}</li>
              <li>{t('privacy.d5')}</li>
              <li>{t('privacy.d6')}</li>
            </ul>

            <h2 className="text-xl font-semibold text-gold">{t('privacy.s3')}</h2>
            <p>{t('privacy.s3text')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('privacy.f1')}</li>
              <li>{t('privacy.f2')}</li>
              <li>{t('privacy.f3')}</li>
              <li>{t('privacy.f4')}</li>
            </ul>

            <h2 className="text-xl font-semibold text-gold">{t('privacy.s4')}</h2>
            <p>
              <strong>{t('privacy.s4t1')}</strong><br />
              {t('privacy.s4t2')}
            </p>

            <h2 className="text-xl font-semibold text-gold">{t('privacy.s5')}</h2>
            <p>{t('privacy.s5text')}</p>

            <h2 className="text-xl font-semibold text-gold">{t('privacy.s6')}</h2>
            <p>{t('privacy.s6text')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('privacy.du1')}</li>
              <li>{t('privacy.du2')}</li>
              <li>{t('privacy.du3')}</li>
              <li>{t('privacy.du4')}</li>
            </ul>
            <p>{t('privacy.du5')}</p>

            <h2 className="text-xl font-semibold text-gold">{t('privacy.s7')}</h2>
            <p>{t('privacy.s7text')}</p>

            <h2 className="text-xl font-semibold text-gold">{t('privacy.s8')}</h2>
            <p>{t('privacy.s8text')}</p>

            <h2 className="text-xl font-semibold text-gold">{t('privacy.s9')}</h2>
            <p>{t('privacy.s9text')}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}


