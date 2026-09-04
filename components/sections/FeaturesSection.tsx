'use client';

import React from 'react';
import {
  Layers,
  SlidersHorizontal,
  Activity,
  ShieldCheck,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function FeaturesSection() {
  const { t } = useI18n();

  const featureCards = [
    {
      id: 'multiPhoto',
      icon: <Layers className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.multiPhoto.title,
      description: t.features.items.multiPhoto.desc,
    },
    {
      id: 'zipBundling',
      icon: <SlidersHorizontal className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.zipBundling.title,
      description: t.features.items.zipBundling.desc,
    },
    {
      id: 'liveProgress',
      icon: <Activity className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.liveProgress.title,
      description: t.features.items.liveProgress.desc,
    },
    {
      id: 'zeroStorage',
      icon: <ShieldCheck className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.zeroStorage.title,
      description: t.features.items.zeroStorage.desc,
    },
    {
      id: 'noWatermarks',
      icon: <Sparkles className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.noWatermarks.title,
      description: t.features.items.noWatermarks.desc,
    },
    {
      id: 'directPassthrough',
      icon: <Cpu className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.directPassthrough.title,
      description: t.features.items.directPassthrough.desc,
    },
  ];

  return (
    <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] transition-colors">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold tracking-widest text-[var(--colors-muted)] uppercase">
              {t.features.eyebrow}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--colors-ink)] tracking-tight">
            {t.features.title}
          </h2>
          <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] max-w-2xl">
            {t.features.subtitle}
          </p>
        </div>

        {/* Feature Cards Grid (1 column on mobile, 3 columns on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {featureCards.map((card) => (
            <div
              key={card.id}
              className="bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] hover:-translate-y-0.5 rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs transition-all duration-300 group select-none"
            >
              <div className="space-y-3.5">
                {/* Elevated Icon Container */}
                <div className="w-10 h-10 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  {card.icon}
                </div>

                {/* Card Title */}
                <h3 className="font-display font-bold text-lg text-[var(--colors-ink)] leading-snug">
                  {card.title}
                </h3>

                {/* Card Description */}
                <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
