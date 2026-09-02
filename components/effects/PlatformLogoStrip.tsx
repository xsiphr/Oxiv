'use client';

import React from 'react';
import { SiTiktok, SiPinterest, SiInstagram, SiFacebook, SiX, SiYoutube } from 'react-icons/si';
import { LogoLoop, LogoItem } from './LogoLoop';

const PLATFORM_LOGOS: LogoItem[] = [
  {
    node: (
      <span className="flex items-center gap-2.5 text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-default" title="TikTok">
        <SiTiktok className="w-5 h-5 shrink-0" />
        <span className="font-mono text-xs font-medium tracking-tight">TikTok</span>
      </span>
    ),
    title: 'TikTok',
  },
  {
    node: (
      <span className="flex items-center gap-2.5 text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-default" title="Pinterest">
        <SiPinterest className="w-5 h-5 shrink-0" />
        <span className="font-mono text-xs font-medium tracking-tight">Pinterest</span>
      </span>
    ),
    title: 'Pinterest',
  },
  {
    node: (
      <span className="flex items-center gap-2.5 text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-default" title="Instagram">
        <SiInstagram className="w-5 h-5 shrink-0" />
        <span className="font-mono text-xs font-medium tracking-tight">Instagram</span>
      </span>
    ),
    title: 'Instagram',
  },
  {
    node: (
      <span className="flex items-center gap-2.5 text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-default" title="Facebook">
        <SiFacebook className="w-5 h-5 shrink-0" />
        <span className="font-mono text-xs font-medium tracking-tight">Facebook</span>
      </span>
    ),
    title: 'Facebook',
  },
  {
    node: (
      <span className="flex items-center gap-2.5 text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-default" title="X (Twitter)">
        <SiX className="w-5 h-5 shrink-0" />
        <span className="font-mono text-xs font-medium tracking-tight">X</span>
      </span>
    ),
    title: 'X',
  },
  {
    node: (
      <span className="flex items-center gap-2.5 text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-default" title="YouTube">
        <SiYoutube className="w-5 h-5 shrink-0" />
        <span className="font-mono text-xs font-medium tracking-tight">YouTube</span>
      </span>
    ),
    title: 'YouTube',
  },
];

export function PlatformLogoStrip() {
  return (
    <section className="w-full bg-[var(--colors-canvas)] transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] py-6 sm:py-7 flex flex-col items-center justify-center gap-4">
        {/* Eyebrow Label */}
        <div className="flex items-center justify-center select-none">
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-[var(--colors-muted)]">
            PLATFORMS
          </span>
        </div>

        {/* Ambient Logo Loop Strip */}
        <div className="w-full overflow-hidden relative">
          <LogoLoop
            logos={PLATFORM_LOGOS}
            speed={45}
            direction="left"
            logoHeight={24}
            gap={44}
            pauseOnHover={false}
            scaleOnHover
            fadeOut
            fadeOutColor="var(--colors-canvas)"
            ariaLabel="Supported extraction platforms"
          />
        </div>
      </div>
    </section>
  );
}

export default PlatformLogoStrip;
