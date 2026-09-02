'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  technicalNote?: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How does Oxiv strip watermarks without re-encoding?',
    answer:
      "Oxiv requests the platform's direct media URL before any client-side watermark overlay is applied, rather than downloading a watermarked video and reprocessing it.",
    technicalNote: 'Original file quality — no re-encoding step involved.',
  },
  {
    id: 'faq-2',
    question: 'Are downloaded assets stored on any intermediate server?',
    answer:
      'No. Oxiv operates under a strict stateless, zero-retention architecture. Media chunks are streamed on-the-fly directly to the client browser. No video, audio, or metadata is ever written to intermediate disk storage or databases.',
    technicalNote: 'Zero telemetry, zero user logging.',
  },
  {
    id: 'faq-3',
    question: 'How does downloading work without CORS errors?',
    answer:
      "Media requests are fetched through Oxiv's backend route (/api/download), which retrieves the file server-side and streams it to your browser with the correct attachment headers, avoiding browser cross-origin blocks.",
    technicalNote: 'Direct browser download with clean filename attachment.',
  },
  {
    id: 'faq-4',
    question: 'Where does the "Recents" list live?',
    answer:
      'The Recents list you see on the homepage is stored entirely in your browser\'s local storage — it never touches Oxiv\'s servers. Nothing is written to any database, and no extraction history is logged, tracked, or associated with you server-side. Clearing your browser data or using a different device clears it too.',
    technicalNote: 'Client-side only. Zero server-side retention, unchanged.',
  },
];

export function FAQSection() {
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
            Frequently asked questions.
          </h2>
          <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] max-w-xl">
            Technical specifications, extraction mechanics, and architecture privacy policies.
          </p>
        </div>

        {/* Minimal Airy Rows separated by dashed hairlines */}
        <div className="border-y border-dashed border-[var(--colors-hairline)] divide-y divide-dashed divide-[var(--colors-hairline)]">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="transition-colors">
                {/* Question Row */}
                <button
                  type="button"
                  onClick={() => toggleFAQ(item.id)}
                  aria-expanded={isOpen}
                  className="w-full py-5 sm:py-6 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer group select-none"
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
                    <div className="pb-6 sm:pb-7 pl-8 sm:pl-10">
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
