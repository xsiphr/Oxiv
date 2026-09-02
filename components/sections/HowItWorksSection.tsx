'use client';

import React from 'react';

interface StepItem {
  number: string;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Paste',
    description: 'Drop any supported link into the bar above.',
  },
  {
    number: '02',
    title: 'Extract',
    description: 'Oxiv resolves the source and streams it live — no queue.',
  },
  {
    number: '03',
    title: 'Download',
    description: 'Save the original file, or grab the whole set as a ZIP.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] transition-colors">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--colors-ink)] tracking-tight">
            How it works.
          </h2>
          <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] max-w-xl">
            Three steps. No sign-up, no waiting rooms.
          </p>
        </div>

        {/* 3-Step Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
          {STEPS.map((step, idx) => (
            <div
              key={step.number}
              className={`flex flex-col justify-between space-y-4 p-6 rounded-xl md:rounded-none bg-[var(--colors-surface-card)] md:bg-transparent border border-[var(--colors-hairline)] md:border-none shadow-xs md:shadow-none ${
                idx > 0
                  ? 'md:border-l md:border-dashed md:border-[var(--colors-hairline)] md:pl-8'
                  : 'md:pr-8'
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
