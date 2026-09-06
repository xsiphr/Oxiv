'use client';

import React from 'react';
import {
  ShieldCheck,
  Layers,
  SlidersHorizontal,
  Music,
  ArrowRightLeft,
  Maximize2,
  Cpu,
  Lock,
  ExternalLink,
  HardDriveDownload,
} from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import { ScrollVelocity } from '@/components/effects/ScrollVelocity';
import { useI18n } from '@/lib/i18n';

export default function PhilosophyPage() {
  const { t } = useI18n();

  const trustMetrics = [
    {
      icon: <Cpu className="w-7 h-7" strokeWidth={1.5} />,
      value: t.metrics.col1.val,
      label: t.about.guaranteeLosslessTitle,
      caption: t.about.guaranteeLosslessDesc,
    },
    {
      icon: <ShieldCheck className="w-7 h-7" strokeWidth={1.5} />,
      value: t.metrics.col2.val,
      label: t.about.guaranteeCleanTitle,
      caption: t.about.guaranteeCleanDesc,
    },
    {
      icon: <HardDriveDownload className="w-7 h-7" strokeWidth={1.5} />,
      value: t.metrics.col3.val,
      label: t.about.guaranteeZeroRetentionTitle,
      caption: t.about.guaranteeZeroRetentionDesc,
    },
  ];

  const engineFeatures = [
    {
      icon: <Layers className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.multiPhoto.title,
      description: t.features.items.multiPhoto.desc,
    },
    {
      icon: <SlidersHorizontal className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.zipBundling.title,
      description: t.features.items.zipBundling.desc,
    },
    {
      icon: <Music className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.audioDemux.title,
      description: t.features.items.audioDemux.desc,
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.antiTracking.title,
      description: t.features.items.antiTracking.desc,
    },
    {
      icon: <ArrowRightLeft className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.shortlinkResolution.title,
      description: t.features.items.shortlinkResolution.desc,
    },
    {
      icon: <Maximize2 className="w-5 h-5 text-[var(--colors-ink)]" strokeWidth={1.75} />,
      title: t.features.items.masterResolution.title,
      description: t.features.items.masterResolution.desc,
    },
  ];

  return (
    <section className="w-full flex-1 flex flex-col">
      <div className="max-w-7xl w-full mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-14 flex-1 flex flex-col">
        {/* 1. Header Title */}
        <div className="space-y-3 max-w-3xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--colors-ink)]">
            {t.about.title}
          </h1>
          <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed max-w-2xl">
            {t.about.subtitle}
          </p>
        </div>

        {/* 2. Mission Lead Manifesto (Seamless On-Canvas Layout, Not a Box Card) */}
        <div id="protocol" className="scroll-mt-32 space-y-4 max-w-4xl">
          <div className="space-y-2">
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-[var(--colors-ink)] tracking-tight">
              {t.about.missionTitle}
            </h2>
            <p className="font-body text-sm sm:text-base font-semibold text-[var(--colors-ink)] leading-relaxed">
              {t.about.missionLead}
            </p>
          </div>
          <div className="space-y-3 font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed">
            <p>{t.about.missionP1}</p>
            <p>{t.about.missionP2}</p>
          </div>
        </div>

        {/* 3. Three Core Trust Metrics & Scroll Velocity Marquee (Seamless Blueprint Ledger) */}
        <div className="border-y border-dashed border-[var(--colors-hairline)] -mx-4 sm:-mx-6 lg:-mx-8 bg-[var(--colors-canvas)]">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 divide-dashed divide-[var(--colors-hairline)]">
            {trustMetrics.map((metric, idx) => (
              <div
                key={idx}
                className={`p-6 sm:p-8 hover:bg-black/[0.04] dark:hover:bg-white/[0.035] transition-all duration-300 flex flex-col items-center text-center justify-center group cursor-default select-none ${
                  idx > 0 ? 'md:border-s md:border-dashed md:border-[var(--colors-hairline)]' : ''
                }`}
              >
                {/* Floating Icon with Gridline Hover Transition */}
                <div className="text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] group-hover:-translate-y-0.5 transition-all duration-300 mb-3">
                  {metric.icon}
                </div>

                {/* 1. Stat Number */}
                <div className="font-mono font-bold text-4xl sm:text-5xl text-[var(--colors-ink)] tracking-tight transition-all">
                  {metric.value}
                </div>

                {/* 2. Short Label */}
                <div className="font-display font-semibold text-base sm:text-lg text-[var(--colors-ink)] mt-1.5">
                  {metric.label}
                </div>

                {/* 3. Per-Column Caption */}
                <p className="font-body text-xs text-[var(--colors-muted)] group-hover:text-[var(--colors-body)] transition-colors mt-2 leading-relaxed max-w-xs">
                  {metric.caption}
                </p>
              </div>
            ))}
          </div>

          {/* Dynamic Scroll Velocity Marquee Strip (Centered, identical to GitHub main version) */}
          <div className="border-t border-dashed border-[var(--colors-hairline)] py-5 sm:py-6 relative overflow-hidden select-none bg-[var(--colors-canvas)]">
            {/* Left / Right Ambient Fade Masks */}
            <div
              className="absolute inset-y-0 left-0 w-16 sm:w-28 pointer-events-none z-10"
              style={{
                background: 'linear-gradient(to right, var(--colors-canvas) 0%, transparent 100%)',
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-16 sm:w-28 pointer-events-none z-10"
              style={{
                background: 'linear-gradient(to left, var(--colors-canvas) 0%, transparent 100%)',
              }}
            />

            <ScrollVelocity
              texts={t.ticker}
              velocity={30}
              numCopies={6}
              className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--colors-ink)] opacity-90 px-3"
            />
          </div>
        </div>

        {/* 4. Merged Architecture & Engine Specifications */}
        <div id="architecture" className="scroll-mt-32 space-y-6 pt-2">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--colors-ink)] tracking-tight">
              {t.about.architectureSectionTitle}
            </h2>
            <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] max-w-2xl">
              {t.about.architectureSectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {engineFeatures.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] space-y-3 shadow-xs transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center text-[var(--colors-ink)]">
                  {item.icon}
                </div>
                <h3 className="font-display font-bold text-base text-[var(--colors-ink)]">
                  {item.title}
                </h3>
                <p className="font-body text-xs text-[var(--colors-body)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Privacy Policy & AGPL-3.0 License Dual Cards */}
        <div id="privacy-license" className="scroll-mt-32 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed border-[var(--colors-hairline)]">
          {/* Privacy & Data Policy */}
          <div className="p-5 sm:p-6 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-[var(--colors-ink)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg">
                {t.about.privacyTitle}
              </h3>
            </div>
            <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed">
              {t.about.privacyDesc}
            </p>
          </div>

          {/* AGPL-3.0 License */}
          <div className="p-5 sm:p-6 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] space-y-3 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--colors-ink)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center">
                  <SiGithub className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base sm:text-lg">
                  {t.about.licenseTitle}
                </h3>
              </div>
              <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed">
                {t.about.licenseDesc}
              </p>
            </div>

            <div className="pt-2">
              <a
                href="https://github.com/xsiphr/Oxiv/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--colors-ink)] hover:underline"
              >
                <span>{t.about.licenseLink}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
