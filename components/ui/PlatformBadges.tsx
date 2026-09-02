'use client';

import React from 'react';
import { Platform } from '@/types';
import { SiTiktok, SiInstagram, SiPinterest, SiX, SiFacebook, SiYoutube } from 'react-icons/si';

import { PLATFORM_REGISTRY, PlatformEntry } from '@/lib/platformRegistry';
import { useI18n } from '@/lib/i18n';

interface PlatformBadgesProps {
  activePlatform: Platform;
}

const PRIMARY_PLATFORMS = ['tiktok', 'instagram', 'facebook', 'pinterest']
  .map((id) => PLATFORM_REGISTRY.find((p) => p.id === id))
  .filter((p): p is PlatformEntry => Boolean(p));

const SECONDARY_PLATFORMS = ['x', 'youtube']
  .map((id) => PLATFORM_REGISTRY.find((p) => p.id === id))
  .filter((p): p is PlatformEntry => Boolean(p));

export function PlatformBadges({ activePlatform }: PlatformBadgesProps) {
  const { t } = useI18n();

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'tiktok':
        return <SiTiktok className="w-3.5 h-3.5 shrink-0" />;
      case 'instagram':
        return <SiInstagram className="w-3.5 h-3.5 shrink-0" />;
      case 'facebook':
        return <SiFacebook className="w-3.5 h-3.5 shrink-0" />;
      case 'pinterest':
        return <SiPinterest className="w-3.5 h-3.5 shrink-0" />;
      case 'x':
        return <SiX className="w-3.5 h-3.5 shrink-0" />;
      case 'youtube':
        return <SiYoutube className="w-3.5 h-3.5 shrink-0" />;
      default:
        return null;
    }
  };

  const renderBadge = (item: PlatformEntry) => {
    const platform = item.id as Platform;
    const isMatched = activePlatform === platform;
    return (
      <div
        key={item.id}
        className={`font-mono text-xs px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-300 flex items-center gap-2 ${
          isMatched
            ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] font-bold shadow-xs border border-[var(--colors-ink)] scale-105'
            : 'bg-[var(--colors-surface-elevated)] text-[var(--colors-muted)] border border-dashed border-[var(--colors-hairline)] opacity-70'
        }`}
      >
        <span
          className={`transition-colors ${
            isMatched ? 'text-[var(--colors-canvas)]' : 'text-[var(--colors-muted)]'
          }`}
        >
          {getPlatformIcon(platform)}
        </span>
        <span>{t.platforms.items?.[item.id]?.name || item.name}</span>
        {isMatched && <span className="text-[9px] opacity-85">●</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 select-none">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {PRIMARY_PLATFORMS.map(renderBadge)}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {SECONDARY_PLATFORMS.map(renderBadge)}
      </div>
    </div>
  );
}
