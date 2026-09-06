'use client';

import React from 'react';
import { SiTiktok, SiInstagram, SiFacebook, SiPinterest, SiX, SiYoutube } from 'react-icons/si';
import { PLATFORM_REGISTRY } from '@/lib/platformRegistry';
import { PlatformLogoStrip } from '@/components/effects/PlatformLogoStrip';
import { useI18n } from '@/lib/i18n';

function getPlatformIcon(id: string) {
  switch (id) {
    case 'tiktok':
      return <SiTiktok className="w-5 h-5 shrink-0" />;
    case 'pinterest':
      return <SiPinterest className="w-5 h-5 shrink-0" />;
    case 'facebook':
      return <SiFacebook className="w-5 h-5 shrink-0" />;
    case 'instagram':
      return <SiInstagram className="w-5 h-5 shrink-0" />;
    case 'x':
      return <SiX className="w-5 h-5 shrink-0" />;
    case 'youtube':
      return <SiYoutube className="w-5 h-5 shrink-0" />;
    default:
      return null;
  }
}

export default function PlatformsPage() {
  const { t } = useI18n();
  const platforms = PLATFORM_REGISTRY.filter((p) => p.status !== 'unsupported');

  return (
    <section className="w-full flex-1 flex flex-col">
      <div className="max-w-7xl w-full mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 sm:space-y-12 flex-1 flex flex-col">
        {/* Header Title */}
        <div className="space-y-3 max-w-3xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--colors-ink)]">
            {t.platforms.title}
          </h1>
          <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed max-w-2xl">
            {t.platforms.subtitle}
          </p>
        </div>

        {/* Platforms Grid */}
        <div id="supported-platforms" className="scroll-mt-32 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const isLive = platform.status === 'live';
            const isNext = platform.status === 'next';
            const statusLabel = isLive
              ? t.platforms.live
              : isNext
              ? t.platforms.next
              : t.platforms.planned;

            return (
              <div
                key={platform.id}
                className="bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs transition-all duration-300 group select-none"
              >
                {/* Header: Icon & Status Badge */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center text-[var(--colors-ink)] group-hover:scale-105 transition-transform">
                      {getPlatformIcon(platform.id)}
                    </div>

                    <span
                      className={`font-mono text-[10px] tracking-widest px-2.5 py-0.5 rounded-full border ${
                        isLive
                          ? 'bg-[var(--colors-surface-elevated)] border-[var(--colors-hairline-strong)] text-[var(--colors-ink)] font-bold'
                          : isNext
                          ? 'bg-[var(--colors-surface-elevated)] border-[var(--colors-hairline)] text-[var(--colors-body)]'
                          : 'bg-transparent border-[var(--colors-hairline)] text-[var(--colors-muted)] opacity-70'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-lg text-[var(--colors-ink)]">
                      {t.platforms.items?.[platform.id]?.name || platform.name}
                    </h3>
                  </div>

                  <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed pt-1">
                    {t.platforms.items?.[platform.id]?.formats || platform.formats}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ambient Infinite Platform Logos Ticker (Centered divider between platforms and formats) */}
        <div id="platform-ticker" className="scroll-mt-32 border-y border-dashed border-[var(--colors-hairline)] -mx-4 sm:-mx-6 lg:-mx-8 my-8 sm:my-10">
          <PlatformLogoStrip />
        </div>

        {/* Supported Link Formats Reference */}
        <div id="link-formats" className="scroll-mt-32 space-y-4">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--colors-ink)] tracking-tight">
              {t.platforms.formatsTitle}
            </h2>
          </div>

          <div
            dir="ltr"
            className="rounded-xl border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] p-4 sm:p-6 font-mono text-xs shadow-xs text-left"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 divide-y md:divide-y-0 md:divide-x divide-dashed divide-[var(--colors-hairline)]">
              {/* Column A */}
              <div className="space-y-2 text-[var(--colors-body)]">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--colors-muted)] select-none">$</span>
                  <span className="text-[var(--colors-ink)]">tiktok.com/@user/video/…</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--colors-muted)] select-none">$</span>
                  <span className="text-[var(--colors-ink)]">instagram.com/reel/…</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--colors-muted)] select-none">$</span>
                  <span className="text-[var(--colors-ink)]">facebook.com/…/videos/…</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--colors-muted)] select-none">$</span>
                  <span className="text-[var(--colors-ink)]">youtube.com/watch?v=…</span>
                </div>
              </div>

              {/* Column B */}
              <div className="space-y-2 pt-3 md:pt-0 md:ps-6 text-[var(--colors-body)]">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--colors-muted)] select-none">$</span>
                  <span className="text-[var(--colors-ink)]">vm.tiktok.com/…</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--colors-muted)] select-none">$</span>
                  <span className="text-[var(--colors-ink)]">pin.it/… · pinterest.com/pin/…</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--colors-muted)] select-none">$</span>
                  <span className="text-[var(--colors-ink)]">x.com/…/status/…</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--colors-muted)] select-none">$</span>
                  <span className="text-[var(--colors-ink)]">youtu.be/…</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
