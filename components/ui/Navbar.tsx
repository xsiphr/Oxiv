'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { SiGithub } from 'react-icons/si';

export function Navbar() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('oxiv_theme') as 'dark' | 'light' | null;
      // Strict default to 'dark' for any new visitor
      const initialTheme = saved === 'light' ? 'light' : 'dark';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
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
    } catch {
      // Safe fallback if localStorage is blocked
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-header border-b border-dashed border-[var(--colors-hairline)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo (Enlarged) */}
        <a href="/" className="select-none">
          <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--colors-ink)] hover:opacity-85 transition-opacity">
            Oxiv
          </span>
        </a>

        {/* Minimal Actions (Enlarged Icons) */}
        <div className="flex items-center gap-2 sm:gap-3 text-[var(--colors-muted)]">
          <a
            href="https://github.com/xsiphr/Oxiv"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--colors-ink)] transition-colors p-2 rounded-xl hover:bg-[var(--colors-surface-card)]"
            aria-label="GitHub Repository"
          >
            <SiGithub className="w-5 h-5" />
          </a>

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
        </div>
      </div>
    </header>
  );
}
