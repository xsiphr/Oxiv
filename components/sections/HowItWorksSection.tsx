'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';

export function HowItWorksSection() {
  const { t } = useI18n();

  const steps = [
    {
      number: t.howItWorks.step1.num,
      title: t.howItWorks.step1.title,
      description: t.howItWorks.step1.desc,
    },
    {
      number: t.howItWorks.step2.num,
      title: t.howItWorks.step2.title,
      description: t.howItWorks.step2.desc,
    },
    {
      number: t.howItWorks.step3.num,
      title: t.howItWorks.step3.title,
      description: t.howItWorks.step3.desc,
    },
  ];

  return (
    <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] transition-colors">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--colors-ink)] tracking-tight">
            {t.howItWorks.title}
          </h2>
          <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] max-w-xl">
            {t.howItWorks.subtitle}
          </p>
        </div>

        {/* 3-Step Columns Grid with logical borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className={`flex flex-col justify-between space-y-4 p-6 rounded-xl md:rounded-none bg-[var(--colors-surface-card)] md:bg-transparent border border-[var(--colors-hairline)] md:border-none shadow-xs md:shadow-none ${
                idx > 0
                  ? 'md:border-s md:border-dashed md:border-[var(--colors-hairline)] md:ps-8'
                  : 'md:pe-8'
              } ${idx === 1 ? 'md:px-8' : ''}`}
            >
              <div className="space-y-3">
                <span className="font-mono text-3xl sm:text-4xl font-bold text-[var(--colors-muted)] opacity-50 select-none">
                  {step.number}
                </span>
                <h3 className="font-display font-bold text-xl text-[var(--colors-ink)]">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-[var(--colors-body)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;

