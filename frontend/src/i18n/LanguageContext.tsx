// src/i18n/LanguageContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { translations, Lang } from './translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'arisa_lang';

let cachedInitialLang: Lang = 'pt';

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`
  );
}

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pt') {
      cachedInitialLang = stored;
    }
  } catch {
    // localStorage unavailable
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(cachedInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next === 'pt' ? 'pt-PT' : 'en';
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[lang] ?? translations.pt;
      const value = dict[key] ?? translations.pt[key] ?? key;
      return interpolate(value, vars);
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'pt' as Lang,
      setLang: () => {},
      t: (key: string, vars?: Record<string, string | number>) => {
        const value = translations.pt[key] ?? key;
        return interpolate(value, vars);
      },
    };
  }
  return ctx;
}
