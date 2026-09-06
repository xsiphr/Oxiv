'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] mt-auto transition-colors select-none">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-row items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Left: Brand Identity (with desktop architecture tagline) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <Link
            href="/"
            className="font-display font-bold text-sm sm:text-base tracking-tight text-[var(--colors-ink)] hover:opacity-85 transition-opacity"
            aria-label="Oxiv Home"
          >
            Oxiv
          </Link>

          <span className="hidden md:inline text-[var(--colors-hairline-strong)] text-xs">/</span>

          <span className="hidden md:inline font-mono text-xs text-[var(--colors-muted)] tracking-tight">
            {t.footer.architecture}
          </span>
        </div>

        {/* Right: License & Links in a single minimal line */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10.5px] sm:text-xs text-[var(--colors-muted)] shrink-0">
          <span>© 2026</span>
          <span className="opacity-40">·</span>
          <span>{t.footer.license}</span>

          <span className="opacity-40">·</span>

          <a
            href="https://github.com/xsiphr/Oxiv"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--colors-ink)] transition-colors inline-flex items-center gap-0.5"
          >
            <span>{t.footer.viewSource}</span>
            <span className="text-[9px] opacity-70 rtl:rotate-180">↗</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

