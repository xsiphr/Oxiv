'use client';

import React from 'react';
import { Cpu, ShieldCheck, HardDriveDownload } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function MetricsGrid() {
  const { t } = useI18n();

  const metrics = [
    {
      icon: <Cpu className="w-7 h-7" strokeWidth={1.5} />,
      value: t.metrics.col1.val,
      label: t.metrics.col1.label,
      caption: t.metrics.col1.caption,
    },
    {
      icon: <ShieldCheck className="w-7 h-7" strokeWidth={1.5} />,
      value: t.metrics.col2.val,
      label: t.metrics.col2.label,
      caption: t.metrics.col2.caption,
    },
    {
      icon: <HardDriveDownload className="w-7 h-7" strokeWidth={1.5} />,
      value: t.metrics.col3.val,
      label: t.metrics.col3.label,
      caption: t.metrics.col3.caption,
    },
  ];

  return (
    <section className="w-full border-y border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] transition-colors">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)]">
        {/* 3-Column Grid with Gridline Hover Effects */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 divide-dashed divide-[var(--colors-hairline)]">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-8 hover:bg-black/[0.04] dark:hover:bg-white/[0.035] transition-all duration-300 flex flex-col items-start justify-center group cursor-default select-none ${
                idx > 0 ? 'md:border-s md:border-dashed md:border-[var(--colors-hairline)]' : ''
              }`}
            >
              {/* Floating Icon with Gridline Hover Transition */}
              <div className="text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] group-hover:-translate-y-0.5 transition-all duration-300 mb-3.5">
                {metric.icon}
              </div>

              {/* 1. Stat Number (Western Arabic numerals in font-mono) */}
              <div className="font-mono font-bold text-4xl sm:text-5xl text-[var(--colors-ink)] tracking-tight transition-all">
                {metric.value}
              </div>

              {/* 2. Short Label */}
              <div className="font-display font-semibold text-base sm:text-lg text-[var(--colors-ink)] mt-1.5">
                {metric.label}
              </div>

              {/* 3. Per-Column Short Caption Line */}
              <p className="font-body text-xs text-[var(--colors-muted)] group-hover:text-[var(--colors-body)] transition-colors mt-1 leading-normal">
                {metric.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MetricsGrid;

