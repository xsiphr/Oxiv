'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Languages, HardDrive, Trash2, Check } from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { useI18n } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/types';

const RECENTS_KEY = 'oxiv_recents_v1';

export function SettingsContent() {
  const { t, locale, setLocale } = useI18n();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cleared, setCleared] = useState(false);
  const [recentCount, setRecentCount] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('oxiv_theme') as 'dark' | 'light' | null;
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      }
      const storedRecents = localStorage.getItem(RECENTS_KEY);
      if (storedRecents) {
        const parsed = JSON.parse(storedRecents);
        if (Array.isArray(parsed)) {
          setRecentCount(parsed.length);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('oxiv_theme', newTheme);
      document.cookie = `oxiv_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(RECENTS_KEY);
      setRecentCount(0);
      setCleared(true);
      setTimeout(() => setCleared(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip">
      {/* 1. Header Navbar */}
      <Navbar />

      {/* 2. Main Page Content */}
      <main className="flex-1 flex flex-col w-full">
        <section className="w-full flex-1 flex flex-col">
          <div className="max-w-7xl w-full mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 flex flex-col">
            <div className="max-w-3xl w-full mx-auto space-y-10 sm:space-y-12">
              {/* Page Header */}
              <div className="space-y-2 border-b border-dashed border-[var(--colors-hairline)] pb-6 text-start">
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--colors-ink)]">
                  {t.settings.title}
                </h1>
                <p className="font-body text-xs sm:text-sm text-[var(--colors-body)]">
                  {t.settings.subtitle}
                </p>
              </div>

              {/* ─── SECTION 1: APPEARANCE & LANGUAGE ─── */}
              <div className="space-y-6 text-start">
                <div className="space-y-1">
                  <h2 className="font-display text-xl font-bold text-[var(--colors-ink)] flex items-center gap-2">
                    <Sun className="w-5 h-5 text-[var(--colors-muted)]" />
                    <span>{t.settings.appearanceTitle}</span>
                  </h2>
                  <p className="font-body text-xs text-[var(--colors-muted)]">
                    {t.settings.appearanceDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Theme Card */}
                  <div className="p-5 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[var(--colors-ink)] uppercase tracking-wider">
                        {t.settings.themeLabel}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--colors-muted)]">
                        {theme === 'dark' ? t.settings.themeDark : t.settings.themeLight}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleThemeChange('dark')}
                        className={`p-3 rounded-lg border font-mono text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] border-[var(--colors-ink)] shadow-xs'
                            : 'bg-[var(--colors-surface-elevated)] border-[var(--colors-hairline)] text-[var(--colors-body)] hover:border-[var(--colors-hairline-strong)]'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span>Dark</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleThemeChange('light')}
                        className={`p-3 rounded-lg border font-mono text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          theme === 'light'
                            ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] border-[var(--colors-ink)] shadow-xs'
                            : 'bg-[var(--colors-surface-elevated)] border-[var(--colors-hairline)] text-[var(--colors-body)] hover:border-[var(--colors-hairline-strong)]'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span>Light</span>
                      </button>
                    </div>
                  </div>

                  {/* Language Card */}
                  <div className="p-5 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[var(--colors-ink)] uppercase tracking-wider">
                        {t.settings.languageLabel}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--colors-muted)]">
                        {locale === 'en' ? t.settings.languageEn : t.settings.languageAr}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleLocaleChange('en')}
                        className={`p-3 rounded-lg border font-mono text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          locale === 'en'
                            ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] border-[var(--colors-ink)] shadow-xs'
                            : 'bg-[var(--colors-surface-elevated)] border-[var(--colors-hairline)] text-[var(--colors-body)] hover:border-[var(--colors-hairline-strong)]'
                        }`}
                      >
                        <Languages className="w-4 h-4" />
                        <span>English</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLocaleChange('ar')}
                        className={`p-3 rounded-lg border font-mono text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          locale === 'ar'
                            ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] border-[var(--colors-ink)] shadow-xs'
                            : 'bg-[var(--colors-surface-elevated)] border-[var(--colors-hairline)] text-[var(--colors-body)] hover:border-[var(--colors-hairline-strong)]'
                        }`}
                      >
                        <Languages className="w-4 h-4" />
                        <span>العربية</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── SECTION 2: CLIENT ARCHITECTURE & LOCAL STORAGE ─── */}
              <div className="space-y-6 pt-6 border-t border-dashed border-[var(--colors-hairline)] text-start">
                <div className="space-y-1">
                  <h2 className="font-display text-xl font-bold text-[var(--colors-ink)] flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-[var(--colors-muted)]" />
                    <span>{t.settings.systemSectionTitle}</span>
                  </h2>
                  <p className="font-body text-xs text-[var(--colors-muted)]">
                    {t.settings.systemSectionDesc}
                  </p>
                </div>

                <div className="p-5 sm:p-6 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--colors-ink)]">
                      {t.settings.storageTitle}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--colors-surface-elevated)] text-[var(--colors-muted)] border border-[var(--colors-hairline)] self-start sm:self-auto">
                      {t.settings.storageZeroRetention}
                    </span>
                  </div>

                  <p className="font-body text-xs text-[var(--colors-body)] leading-relaxed">
                    {t.settings.storageDesc}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-dashed border-[var(--colors-hairline)]">
                    <span className="font-mono text-xs text-[var(--colors-muted)]">
                      {recentCount > 0 ? `${recentCount} items cached locally` : 'No items cached'}
                    </span>

                    <button
                      type="button"
                      onClick={handleClearHistory}
                      disabled={cleared || recentCount === 0}
                      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                        cleared
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : recentCount === 0
                          ? 'opacity-50 cursor-not-allowed bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-muted)]'
                          : 'bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] hover:border-[var(--colors-hairline-strong)] cursor-pointer'
                      }`}
                    >
                      {cleared ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.settings.storageCleared}</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5 text-[var(--colors-muted)]" />
                          <span>{t.settings.storageClearBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Global Footer */}
      <Footer />
    </div>
  );
}

export default SettingsContent;
