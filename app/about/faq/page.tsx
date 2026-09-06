'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Shield, Cpu } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function FAQPage() {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>('faq-2');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.startsWith('faq-')) {
        setOpenId(hash);
      } else if (hash === 'how-it-works') {
        setOpenId('faq-1');
      } else if (hash === 'data-privacy') {
        setOpenId('faq-2');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const privacyItemIds = ['faq-2', 'faq-4', 'faq-5'];
  const howItWorksItemIds = ['faq-1', 'faq-3', 'faq-6', 'faq-7'];

  const privacyItems = t.faq.items.filter((item) => privacyItemIds.includes(item.id));
  const howItWorksItems = t.faq.items.filter((item) => howItWorksItemIds.includes(item.id));

  const groups = [
    {
      id: 'privacy',
      title: t.about.faqGroupPrivacy,
      icon: Shield,
      items: privacyItems,
    },
    {
      id: 'how-it-works',
      title: t.about.faqGroupHowItWorks,
      icon: Cpu,
      items: howItWorksItems,
    },
  ];

  return (
    <section className="w-full flex-1 flex flex-col">
      <div className="max-w-7xl w-full mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-14 flex-1 flex flex-col">
        {/* Header Title */}
        <div className="space-y-3 max-w-3xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--colors-ink)]">
            {t.faq.title}
          </h1>
          <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed max-w-2xl">
            {t.faq.subtitle}
          </p>
        </div>

        {/* FAQ Groups */}
        <div className="space-y-12">
          {groups.map((group, groupIndex) => {
            const GroupIcon = group.icon;
            const groupId = group.id === 'privacy' ? 'data-privacy' : 'how-it-works';
            return (
              <div key={group.id} id={groupId} className="scroll-mt-32 space-y-4">
                {/* Subtle Group Subheading */}
                <div className="flex items-center gap-2 text-[var(--colors-muted)]">
                  <div className="w-6 h-6 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center text-[var(--colors-ink)]">
                    <GroupIcon className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-[var(--colors-ink)]">
                    {group.title}
                  </h2>
                </div>

                {/* Minimal Airy Rows separated by dashed hairlines */}
                <div className="border-y border-dashed border-[var(--colors-hairline)] divide-y divide-dashed divide-[var(--colors-hairline)]">
                  {group.items.map((item, itemIdx) => {
                    const isOpen = openId === item.id;
                    const overallIndex = groupIndex === 0 ? itemIdx + 1 : privacyItems.length + itemIdx + 1;
                    return (
                      <div
                        key={item.id}
                        id={item.id}
                        className="scroll-mt-32 transition-colors"
                      >
                        {/* Question Row */}
                        <button
                          type="button"
                          onClick={() => toggleFAQ(item.id)}
                          aria-expanded={isOpen}
                          className="w-full py-4 sm:py-5 text-start flex items-center justify-between gap-4 transition-colors cursor-pointer group select-none"
                        >
                          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                            <span className="font-mono text-xs sm:text-sm text-[var(--colors-muted)] shrink-0 select-none">
                              {String(overallIndex).padStart(2, '0')}
                            </span>
                            <h3 className="font-display font-semibold text-sm sm:text-base md:text-lg text-[var(--colors-ink)]">
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

                        {/* Animated Answer Content */}
                        <div
                          className={`grid transition-all duration-300 ease-out overflow-hidden ${
                            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                          }`}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div className="pb-5 sm:pb-6 ps-7 sm:ps-10">
                              <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed">
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
