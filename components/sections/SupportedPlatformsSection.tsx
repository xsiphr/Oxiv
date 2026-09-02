'use client';

import React from 'react';
import { SiTiktok, SiInstagram, SiFacebook, SiPinterest, SiX, SiYoutube } from 'react-icons/si';

import { PLATFORM_REGISTRY } from '@/lib/platformRegistry';

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

export function SupportedPlatformsSection() {
  const platforms = PLATFORM_REGISTRY.filter((p) => p.status !== 'unsupported');

  return (
    <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] transition-colors">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--colors-ink)] tracking-tight">
            Supported platforms.
          </h2>
          <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] max-w-2xl">
            Every format Oxiv can pull, per platform — no watermarks, no re-encoding.
          </p>
        </div>

        {/* Future-proof Platform Cards Grid (Fixed max 4 columns on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {platforms.map((platform) => {
            const isLive = platform.status === 'live';
            const isNext = platform.status === 'next';
            const statusLabel = platform.status.toUpperCase();

            return (
              <div
                key={platform.id}
                className="bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs transition-all duration-300 group"
              >
                {/* Header: Icon & Status Badge */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center text-[var(--colors-ink)] group-hover:scale-105 transition-transform">
                      {getPlatformIcon(platform.id)}
                    </div>

                    <span
                      className={`font-mono text-[10px] tracking-widest px-2 py-0.5 rounded-full border ${
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
                      {platform.name}
                    </h3>
                  </div>

                  <p className="font-body text-xs text-[var(--colors-body)] leading-relaxed pt-1">
                    {platform.formats}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supported Link Formats Reference Code Block with Sub-heading */}
        <div className="space-y-3 pt-4 border-t border-dashed border-[var(--colors-hairline)]">
          <h3 className="font-display font-bold text-lg text-[var(--colors-ink)]">
            Supported link formats.
          </h3>

          <div className="rounded-xl border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] p-4 sm:p-5 font-mono text-xs shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 divide-y md:divide-y-0 md:divide-x divide-dashed divide-[var(--colors-hairline)]">
              {/* Column A (4 lines) */}
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

              {/* Column B (4 lines) */}
              <div className="space-y-2 pt-3 md:pt-0 md:pl-6 text-[var(--colors-body)]">
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

export default SupportedPlatformsSection;
