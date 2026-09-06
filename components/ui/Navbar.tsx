'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, ChevronDown } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import { useI18n } from '@/lib/i18n';
import { ExtractionStatus } from '@/types';
import { MegaMenu } from './MegaMenu';

export interface NavbarProps {
  status?: ExtractionStatus;
}

export function Navbar({ status: _status = 'idle' }: NavbarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync theme for logo invert filter
  useEffect(() => {
    try {
      const saved = localStorage.getItem('oxiv_theme') as 'dark' | 'light' | null;
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Close menus whenever pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMegaMenuOpen(false);
  }, [pathname]);

  const handleMouseEnterAbout = () => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setIsMegaMenuOpen(true);
  };

  const handleMouseLeaveAbout = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 180);
  };

  const isHomeActive = pathname === '/';
  const isRecentsActive = pathname === '/recents';
  const isAboutActive = pathname.startsWith('/about');
  const isSupportActive = pathname === '/support';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dashed border-[var(--colors-hairline)] transition-colors duration-300">
      {/* Scoped Glass Header Backdrop for Navbar (prevents nested backdrop-filter clipping on MegaMenu) */}
      <div className="absolute inset-0 glass-header -z-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4 relative">
        {/* Brand Logo & Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 select-none group flex-shrink-0" aria-label="Oxiv">
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

        {/* ─── Desktop Clean Text Links with MegaMenu ─── */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 h-full">
          {/* Main Downloader / Home Link */}
          <Link
            href="/"
            className={`font-mono text-xs sm:text-sm tracking-tight transition-colors py-1.5 relative ${
              isHomeActive
                ? 'text-[var(--colors-ink)] font-bold'
                : 'text-[var(--colors-body)] hover:text-[var(--colors-ink)]'
            }`}
          >
            <span>{t.nav.downloader}</span>
            {isHomeActive && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[var(--colors-ink)] rounded-full animate-fadeIn" />
            )}
          </Link>

          {/* Recents Link */}
          <Link
            href="/recents"
            className={`font-mono text-xs sm:text-sm tracking-tight transition-colors py-1.5 relative ${
              isRecentsActive
                ? 'text-[var(--colors-ink)] font-bold'
                : 'text-[var(--colors-body)] hover:text-[var(--colors-ink)]'
            }`}
          >
            <span>{t.nav.recents}</span>
            {isRecentsActive && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[var(--colors-ink)] rounded-full animate-fadeIn" />
            )}
          </Link>

          {/* About Link with MegaMenu Hover Trigger */}
          <div
            className="h-full flex items-center"
            onMouseEnter={handleMouseEnterAbout}
            onMouseLeave={handleMouseLeaveAbout}
          >
            <Link
              href="/about"
              onClick={() => setIsMegaMenuOpen(false)}
              className={`font-mono text-xs sm:text-sm tracking-tight transition-colors h-full inline-flex items-center gap-1.5 relative ${
                isAboutActive
                  ? 'text-[var(--colors-ink)] font-bold'
                  : 'text-[var(--colors-body)] hover:text-[var(--colors-ink)]'
              }`}
            >
              <span>{t.nav.about}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMegaMenuOpen ? 'rotate-180 text-[var(--colors-ink)]' : 'text-[var(--colors-muted)]'
                }`}
              />
              {isAboutActive && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[var(--colors-ink)] rounded-full animate-fadeIn" />
              )}
            </Link>
          </div>

          {/* Support Link */}
          <Link
            href="/support"
            className={`font-mono text-xs sm:text-sm tracking-tight transition-colors py-1.5 relative ${
              isSupportActive
                ? 'text-[var(--colors-ink)] font-bold'
                : 'text-[var(--colors-body)] hover:text-[var(--colors-ink)]'
            }`}
          >
            <span>{t.nav.support}</span>
            {isSupportActive && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[var(--colors-ink)] rounded-full animate-fadeIn" />
            )}
          </Link>
        </nav>

        {/* ─── Desktop Icon-Only Quick Actions & Mobile Hamburger ─── */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-[var(--colors-muted)]">
          {/* Settings Shortcut (Desktop only) */}
          <Link
            href="/settings"
            className={`hidden md:flex p-2 rounded-xl transition-colors ${
              pathname === '/settings'
                ? 'text-[var(--colors-ink)] bg-[var(--colors-surface-card)]'
                : 'hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-card)]'
            }`}
            title={t.nav.settings}
            aria-label={t.nav.settings}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          {/* GitHub Icon -> Activity & Commit Ledger (Desktop only) */}
          <Link
            href="/activity"
            className={`hidden md:flex p-2 rounded-xl transition-colors ${
              pathname === '/activity'
                ? 'text-[var(--colors-ink)] bg-[var(--colors-surface-card)]'
                : 'hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-card)]'
            }`}
            title={t.nav.activity}
            aria-label={t.nav.activity}
          >
            <SiGithub className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          {/* Mobile Hamburger Button (< 768px) with 2-line smooth morphing animation to X (borderless) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden ms-1 w-9 h-9 flex items-center justify-center rounded-xl text-[var(--colors-ink)] hover:bg-[var(--colors-surface-card)] cursor-pointer focus:outline-none transition-colors"
            aria-label={t.nav.menu}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="relative w-5 h-4 flex items-center justify-center">
              <span
                className={`absolute h-[2px] w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-[5px]'
                }`}
              />
              <span
                className={`absolute h-[2px] w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-[5px]'
                }`}
              />
            </span>
          </button>
        </div>

        {/* MegaMenu Popover (Anchored directly under navbar bottom border and bounded by the guidelines) */}
        <MegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
          onMouseEnter={handleMouseEnterAbout}
          onMouseLeave={handleMouseLeaveAbout}
        />
      </div>

      {/* ─── Mobile Slide-Down Drawer (< 768px) with Navbar Glass Blur ─── */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden border-t border-dashed border-[var(--colors-hairline)] glass-header px-4 py-4 space-y-3 animate-fadeIn shadow-xl"
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <nav className="flex flex-col space-y-1">
            {/* Downloader Link */}
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-3 rounded-lg font-mono text-xs flex items-center transition-colors ${
                pathname === '/'
                  ? 'bg-[var(--colors-surface-elevated)] text-[var(--colors-ink)] font-bold'
                  : 'text-[var(--colors-body)] hover:text-[var(--colors-ink)]'
              }`}
            >
              <span>01. {t.nav.downloader}</span>
            </Link>

            {/* Recents Link */}
            <Link
              href="/recents"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-3 rounded-lg font-mono text-xs flex items-center transition-colors ${
                pathname === '/recents'
                  ? 'bg-[var(--colors-surface-elevated)] text-[var(--colors-ink)] font-bold'
                  : 'text-[var(--colors-body)] hover:text-[var(--colors-ink)]'
              }`}
            >
              <span>02. {t.nav.recents}</span>
            </Link>

            {/* About Top-Level Item */}
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-3 rounded-lg font-mono text-xs flex items-center transition-colors ${
                pathname.startsWith('/about')
                  ? 'bg-[var(--colors-surface-elevated)] text-[var(--colors-ink)] font-bold'
                  : 'text-[var(--colors-body)] hover:text-[var(--colors-ink)]'
              }`}
            >
              <span>03. {t.nav.about}</span>
            </Link>

            {/* About Sub-sections (Indented sub-links) */}
            <div className="ps-4 pe-1 py-1 space-y-1 border-s border-dashed border-[var(--colors-hairline)] ms-3 my-1">
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block py-1.5 px-2.5 rounded font-mono text-[11px] transition-colors ${
                  pathname === '/about'
                    ? 'text-[var(--colors-ink)] font-bold bg-[var(--colors-surface-elevated)]'
                    : 'text-[var(--colors-muted)] hover:text-[var(--colors-ink)]'
                }`}
              >
                ↳ {t.about.navPhilosophy}
              </Link>
              <Link
                href="/about/platforms"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block py-1.5 px-2.5 rounded font-mono text-[11px] transition-colors ${
                  pathname === '/about/platforms'
                    ? 'text-[var(--colors-ink)] font-bold bg-[var(--colors-surface-elevated)]'
                    : 'text-[var(--colors-muted)] hover:text-[var(--colors-ink)]'
                }`}
              >
                ↳ {t.about.navPlatforms}
              </Link>
              <Link
                href="/about/faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block py-1.5 px-2.5 rounded font-mono text-[11px] transition-colors ${
                  pathname === '/about/faq'
                    ? 'text-[var(--colors-ink)] font-bold bg-[var(--colors-surface-elevated)]'
                    : 'text-[var(--colors-muted)] hover:text-[var(--colors-ink)]'
                }`}
              >
                ↳ {t.about.navFaq}
              </Link>
            </div>

            {/* Support Link */}
            <Link
              href="/support"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-3 rounded-lg font-mono text-xs flex items-center transition-colors ${
                pathname === '/support'
                  ? 'bg-[var(--colors-surface-elevated)] text-[var(--colors-ink)] font-bold'
                  : 'text-[var(--colors-body)] hover:text-[var(--colors-ink)]'
              }`}
            >
              <span>04. {t.nav.support}</span>
            </Link>
          </nav>

          {/* Quick Actions Row in Mobile Drawer */}
          <div className="pt-3 border-t border-dashed border-[var(--colors-hairline)] flex items-center justify-around text-[var(--colors-muted)]">
            <Link
              href="/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-elevated)] transition-colors flex items-center gap-1.5 font-mono text-xs"
            >
              <Settings className="w-4 h-4" />
              <span>{t.nav.settings}</span>
            </Link>

            <Link
              href="/activity"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-elevated)] transition-colors flex items-center gap-1.5 font-mono text-xs"
            >
              <SiGithub className="w-4 h-4" />
              <span>{t.nav.activity}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
