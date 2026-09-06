'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Coffee,
  Star,
  Share2,
  Bug,
  Lightbulb,
} from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Oxi } from '@/components/ui/Oxi';
import { useI18n } from '@/lib/i18n';

export function SupportContent() {
  const { t } = useI18n();
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [isAnticipating, setIsAnticipating] = useState(false);

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined') {
        const shareUrl = window.location.origin;
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          setIsShareCopied(true);
          setTimeout(() => setIsShareCopied(false), 2000);
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip">
      {/* 1. Header Navbar */}
      <Navbar />

      {/* 2. Main Page Content (Continuous Blueprint Gridline Container) */}
      <main className="flex-1 flex flex-col w-full">
        <section className="w-full flex-1 flex flex-col">
          <div className="max-w-7xl w-full mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1 flex flex-col space-y-10 sm:space-y-14">
            {/* Top Hero: Oxi Mascot (Left) & Compact Buy Me a Coffee Card (Right) */}
            <div className="max-w-3xl mx-auto w-full flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
              {/* Oxi Mascot (Large & Free-standing like in Hero with Anticipation on hover) */}
              <div className="flex-shrink-0 flex items-center justify-center select-none py-2">
                <Oxi
                  status="idle"
                  size="clamp(115px, 14vw, 140px)"
                  isAnticipating={isAnticipating}
                  className="shrink-0"
                />
              </div>

              {/* Compact Buy Me a Coffee Card */}
              <div className="flex-1 w-full sm:max-w-md p-5 sm:p-6 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] shadow-xs space-y-4 text-center sm:text-start">
                <div className="space-y-1.5">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--colors-ink)] flex items-center gap-2 justify-center sm:justify-start">
                    <Coffee className="w-5 h-5 text-[var(--colors-ink)] shrink-0" />
                    <span>{t.support.coffeeBtn}</span>
                  </h1>
                  <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed">
                    {t.support.coffeeDesc}
                  </p>
                </div>

                <div className="pt-1 flex justify-center sm:justify-start">
                  <a
                    href="https://buymeacoffee.com/xsiphr"
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setIsAnticipating(true)}
                    onMouseLeave={() => setIsAnticipating(false)}
                    onFocus={() => setIsAnticipating(true)}
                    onBlur={() => setIsAnticipating(false)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--colors-ink)] text-[var(--colors-canvas)] font-semibold text-xs sm:text-sm shadow-xs hover:opacity-90 active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
                  >
                    <span>{t.support.coffeeBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5 rtl:rotate-180" />
                  </a>
                </div>
              </div>
            </div>

            {/* Seamless Edge-to-Edge Gridline Divider */}
            <div className="border-t border-dashed border-[var(--colors-hairline)] -mx-4 sm:-mx-6 lg:-mx-8" />

            {/* SECTION 2: Community Support Actions */}
            <div className="max-w-3xl mx-auto space-y-6 w-full">
              <div className="space-y-1 text-start">
                <h2 className="font-display text-2xl font-bold text-[var(--colors-ink)] tracking-tight">
                  {t.support.communityTitle}
                </h2>
                <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)]">
                  {t.support.communitySubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Star on GitHub */}
                <div className="p-5 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col justify-between gap-4 shadow-xs">
                  <div className="space-y-2 text-start">
                    <div className="w-8 h-8 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center text-[var(--colors-ink)]">
                      <Star className="w-4 h-4" />
                    </div>
                    <h3 className="font-display font-bold text-base text-[var(--colors-ink)]">
                      {t.support.starGithubTitle}
                    </h3>
                    <p className="font-body text-xs text-[var(--colors-muted)] leading-relaxed">
                      {t.support.starGithubDesc}
                    </p>
                  </div>

                  <a
                    href="https://github.com/xsiphr/Oxiv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] hover:border-[var(--colors-hairline-strong)] font-mono text-xs font-semibold transition-all"
                  >
                    <span>{t.support.starGithubBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5 rtl:rotate-180" />
                  </a>
                </div>

                {/* 2. Share Oxiv */}
                <div className="p-5 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col justify-between gap-4 shadow-xs">
                  <div className="space-y-2 text-start">
                    <div className="w-8 h-8 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center text-[var(--colors-ink)]">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <h3 className="font-display font-bold text-base text-[var(--colors-ink)]">
                      {t.support.shareTitle}
                    </h3>
                    <p className="font-body text-xs text-[var(--colors-muted)] leading-relaxed">
                      {t.support.shareDesc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleShare}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                      isShareCopied
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] hover:border-[var(--colors-hairline-strong)]'
                    }`}
                  >
                    {isShareCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.support.shareCopied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.support.shareBtn}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3. Report Bug */}
                <div className="p-5 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col justify-between gap-4 shadow-xs">
                  <div className="space-y-2 text-start">
                    <div className="w-8 h-8 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center text-[var(--colors-ink)]">
                      <Bug className="w-4 h-4" />
                    </div>
                    <h3 className="font-display font-bold text-base text-[var(--colors-ink)]">
                      {t.support.issueTitle}
                    </h3>
                    <p className="font-body text-xs text-[var(--colors-muted)] leading-relaxed">
                      {t.support.issueDesc}
                    </p>
                  </div>

                  <a
                    href="https://github.com/xsiphr/Oxiv/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] hover:border-[var(--colors-hairline-strong)] font-mono text-xs font-semibold transition-all"
                  >
                    <span>{t.support.issueBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5 rtl:rotate-180" />
                  </a>
                </div>

                {/* 4. Feature Request */}
                <div className="p-5 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col justify-between gap-4 shadow-xs">
                  <div className="space-y-2 text-start">
                    <div className="w-8 h-8 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center text-[var(--colors-ink)]">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <h3 className="font-display font-bold text-base text-[var(--colors-ink)]">
                      {t.support.featureTitle}
                    </h3>
                    <p className="font-body text-xs text-[var(--colors-muted)] leading-relaxed">
                      {t.support.featureDesc}
                    </p>
                  </div>

                  <a
                    href="https://github.com/xsiphr/Oxiv/issues/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] hover:border-[var(--colors-hairline-strong)] font-mono text-xs font-semibold transition-all"
                  >
                    <span>{t.support.featureBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5 rtl:rotate-180" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Global Footer */}
      <Footer />
    </div>
  );
}

export default SupportContent;
