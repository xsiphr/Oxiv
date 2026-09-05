'use client';

import React from 'react';
import { SiGithub, SiBuymeacoffee } from 'react-icons/si';
import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] mt-auto transition-colors">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-row items-center justify-between gap-3 sm:gap-4 w-full">
        {/* Brand Mark & Protocol Tagline (Left) */}
        <div className="flex items-center gap-2 sm:gap-2.5 font-mono text-[11px] sm:text-xs text-[var(--colors-muted)] min-w-0">
          <span className="font-display font-bold text-sm sm:text-base text-[var(--colors-ink)] shrink-0">
            Oxiv
          </span>
          <span className="opacity-60 shrink-0">•</span>
          <span className="truncate">{t.footer.architecture}</span>
        </div>

        {/* External Links (Right) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <a
            href="https://www.buymeacoffee.com/xsiphr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors p-1.5 rounded-lg shrink-0"
            aria-label="Buy me a coffee"
          >
            <SiBuymeacoffee className="w-4 h-4" />
            <span>{t.footer.support}</span>
          </a>

          <a
            href="https://github.com/xsiphr/Oxiv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors p-1.5 rounded-lg shrink-0"
            aria-label="GitHub Repository"
          >
            <SiGithub className="w-4 h-4" />
            <span>{t.footer.github}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

