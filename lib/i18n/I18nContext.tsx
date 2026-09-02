'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Locale, TranslationDictionary } from './types';
import { en } from './locales/en';
import { ar } from './locales/ar';

interface I18nContextType {
  locale: Locale;
  t: TranslationDictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  ar,
};

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  t: en,
  setLocale: () => {},
  toggleLocale: () => {},
});

function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('oxiv_lang') as Locale | null;
      if (saved === 'ar' || saved === 'en') {
        return saved;
      }
      if (document.documentElement.lang === 'ar' || document.documentElement.lang === 'en') {
        return document.documentElement.lang as Locale;
      }
    } catch {
      // ignore
    }
  }
  return 'en';
}

export function I18nProvider({
  children,
  initialLocale = 'en',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('oxiv_lang') as Locale | null;
        if (saved === 'ar' || saved === 'en') {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return initialLocale;
  });

  // Sync state if localStorage was loaded before hydration or changed
  useEffect(() => {
    try {
      const saved = localStorage.getItem('oxiv_lang') as Locale | null;
      if (saved === 'ar' || saved === 'en') {
        document.cookie = `oxiv_lang=${saved}; path=/; max-age=31536000; SameSite=Lax`;
        if (saved !== locale) {
          setLocaleState(saved);
          document.documentElement.lang = saved;
          document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
        }
      } else {
        document.cookie = `oxiv_lang=${initialLocale}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('oxiv_lang', nextLocale);
      document.cookie = `oxiv_lang=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Safe fallback if localStorage is blocked
    }
  };

  const toggleLocale = () => {
    const next = locale === 'en' ? 'ar' : 'en';
    setLocale(next);
  };

  const value = useMemo(
    () => ({
      locale,
      t: dictionaries[locale],
      setLocale,
      toggleLocale,
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
