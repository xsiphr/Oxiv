'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import { useI18n } from '@/lib/i18n';
import { ExtractionStatus } from '@/types';

export interface NavbarProps {
  status?: ExtractionStatus;
}

export function Navbar({ status: _status = 'idle' }: NavbarProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('oxiv_theme') as 'dark' | 'light' | null;
        if (saved === 'light' || saved === 'dark') return saved;
      } catch {
        // ignore
      }
    }
    return 'dark';
  });
  const { toggleLocale, t } = useI18n();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('oxiv_theme') as 'dark' | 'light' | null;
      // Strict default to 'dark' for any new visitor
      const initialTheme = saved === 'light' ? 'light' : 'dark';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
      document.cookie = `oxiv_theme=${initialTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('oxiv_theme', nextTheme);
      document.cookie = `oxiv_theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Safe fallback if localStorage is blocked
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-header border-b border-dashed border-[var(--colors-hairline)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 select-none group" aria-label="Oxiv">
          <img
            src="/logos/oxi.svg"
            alt="Oxi Logo"
            className={`w-auto h-7 sm:h-8 object-contain transition-transform group-hover:scale-105 ${
              theme === 'light' ? 'invert' : ''
            }`}
          />
          <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-[var(--colors-ink)] transition-opacity group-hover:opacity-85">
            Oxiv
          </span>
        </Link>

        {/* Minimal Actions (GitHub, Theme Toggle, Language Switcher) */}
        <div className="flex items-center gap-2 sm:gap-3 text-[var(--colors-muted)]">
          <Link
            href="/activity"
            className="hover:text-[var(--colors-ink)] transition-colors p-2 rounded-xl hover:bg-[var(--colors-surface-card)]"
            aria-label="GitHub Activity"
          >
            <SiGithub className="w-5 h-5" />
          </Link>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hover:text-[var(--colors-ink)] transition-colors p-2 rounded-xl hover:bg-[var(--colors-surface-card)] cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Language Switcher Button (Far right without border, icon style) */}
          <button
            type="button"
            onClick={toggleLocale}
            className="hover:text-[var(--colors-ink)] transition-colors p-2 rounded-xl hover:bg-[var(--colors-surface-card)] cursor-pointer select-none flex items-center justify-center w-9 h-9"
            aria-label="Toggle language (English / Arabic)"
          >
            <span className="font-mono text-xs font-semibold uppercase leading-none">
              {t.nav.langToggle}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
