'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function FAQSection() {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] transition-colors">
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--colors-ink)] tracking-tight">
            {t.faq.title}
          </h2>
          <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] max-w-xl">
            {t.faq.subtitle}
          </p>
        </div>

        {/* Minimal Airy Rows separated by dashed hairlines */}
        <div className="border-y border-dashed border-[var(--colors-hairline)] divide-y divide-dashed divide-[var(--colors-hairline)]">
          {t.faq.items.map((item, idx) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="transition-colors">
                {/* Question Row */}
                <button
                  type="button"
                  onClick={() => toggleFAQ(item.id)}
                  aria-expanded={isOpen}
                  className="w-full py-5 sm:py-6 text-start flex items-center justify-between gap-4 transition-colors cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <span className="font-mono text-sm sm:text-base text-[var(--colors-muted)] shrink-0 select-none">
                      0{idx + 1}
                    </span>
                    <h3 className="font-display font-semibold text-base sm:text-lg text-[var(--colors-ink)]">
                      {item.question}
                    </h3>
                  </div>

                  <div className="text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] shrink-0 transition-colors p-1">
                    <Plus
                      className={`w-4 h-4 transition-transform duration-300 ease-out ${
                        isOpen ? 'rotate-45 text-[var(--colors-ink)]' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Soft Smooth Animated Answer Content */}
                <div
                  className={`grid transition-all duration-300 ease-out overflow-hidden ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="pb-6 sm:pb-7 ps-8 sm:ps-10">
                      <p className="font-body text-sm text-[var(--colors-body)] leading-relaxed">
                        {item.answer}
                        {item.technicalNote && (
                          <span className="block pt-2 text-xs text-[var(--colors-muted)] font-mono">
                            ↳ {item.technicalNote}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;

