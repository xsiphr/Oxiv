'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, GitCommit, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { useI18n } from '@/lib/i18n';

export interface GitHubCommitData {
  sha: string;
  html_url: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
}

interface ActivityViewProps {
  commits: GitHubCommitData[];
  error?: string | null;
}

const WEEKS_COUNT = 20;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function ActivityView({ commits, error }: ActivityViewProps) {
  const { t, locale } = useI18n();
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Group commits by YYYY-MM-DD
  const commitCountByDate: Record<string, number> = {};
  commits.forEach((c) => {
    const rawDate = c.commit?.author?.date || c.commit?.committer?.date;
    if (rawDate) {
      const key = rawDate.slice(0, 10);
      commitCountByDate[key] = (commitCountByDate[key] || 0) + 1;
    }
  });

  // Calculate heatmap weeks grid
  const today = new Date();
  const endDay = new Date(today);
  endDay.setDate(today.getDate() + (6 - today.getDay()));
  endDay.setHours(23, 59, 59, 999);

  const totalDays = WEEKS_COUNT * 7;
  const startDay = new Date(endDay);
  startDay.setDate(endDay.getDate() - totalDays + 1);
  startDay.setHours(0, 0, 0, 0);

  const weeks: Array<
    Array<{
      dateStr: string;
      dateObj: Date;
      count: number;
      intensity: number;
      isFuture: boolean;
    }>
  > = [];

  const monthHeaders: Array<{ label: string; colIndex: number }> = [];
  let cur = new Date(startDay);
  let lastMonth = -1;

  for (let w = 0; w < WEEKS_COUNT; w++) {
    const week = [];
    const firstDayOfWeek = new Date(cur);
    if (firstDayOfWeek.getMonth() !== lastMonth) {
      lastMonth = firstDayOfWeek.getMonth();
      const monthName = firstDayOfWeek.toLocaleString('en-US', { month: 'short' });
      monthHeaders.push({ label: monthName, colIndex: w });
    }

    for (let d = 0; d < 7; d++) {
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const count = commitCountByDate[key] || 0;
      const isFuture = cur > today;

      let intensity = 0;
      if (!isFuture) {
        if (count >= 7) intensity = 4;
        else if (count >= 4) intensity = 3;
        else if (count >= 2) intensity = 2;
        else if (count >= 1) intensity = 1;
      }

      week.push({
        dateStr: key,
        dateObj: new Date(cur),
        count,
        intensity,
        isFuture,
      });

      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const getIntensityClass = (intensity: number, isFuture: boolean) => {
    if (isFuture) {
      return 'bg-[var(--colors-surface-card)]/30 border border-dashed border-[var(--colors-hairline)]/30 opacity-30 cursor-not-allowed';
    }
    switch (intensity) {
      case 1:
        return 'bg-[var(--colors-ink)]/20 border border-[var(--colors-ink)]/30';
      case 2:
        return 'bg-[var(--colors-ink)]/45 border border-[var(--colors-ink)]/55';
      case 3:
        return 'bg-[var(--colors-ink)]/75 border border-[var(--colors-ink)]/85';
      case 4:
        return 'bg-[var(--colors-ink)] border border-[var(--colors-ink)]';
      case 0:
      default:
        return 'bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)]/60 hover:border-[var(--colors-hairline-strong)]';
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip">
      {/* 1. Header Navbar */}
      <Navbar />

      {/* 2. Main Content */}
      <main className="flex-1 flex flex-col w-full">
        {/* Navigation & Header Bar */}
        <div className="w-full border-b border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
            {/* Back to Home Link */}
            <Link
              href="/"
              className="group inline-flex items-center gap-2 font-mono text-xs sm:text-sm text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
              <span>{t.activity.backToHome}</span>
            </Link>

            {/* External Repo Link */}
            <a
              href="https://github.com/xsiphr/Oxiv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] hover:bg-[var(--colors-surface-elevated)] text-[var(--colors-ink)] font-mono text-xs transition-all shadow-xs"
            >
              <SiGithub className="w-4 h-4" />
              <span>{t.activity.viewOnGithub}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Hero Section of Activity Page */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-mono text-[11px] font-semibold tracking-widest text-[var(--colors-muted)] uppercase bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] px-2.5 py-1 rounded-md">
                xsiphr/Oxiv
              </span>
              <span className="font-mono text-xs text-[var(--colors-body)]">
                {t.activity.totalCommits(commits.length)}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--colors-ink)] tracking-tight">
              {t.activity.title}
            </h1>
            <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] max-w-2xl">
              {t.activity.subtitle}
            </p>
          </div>
        </section>

        {/* Fallback View if GitHub API Failed */}
        {error ? (
          <section className="w-full border-t border-dashed border-[var(--colors-hairline)]">
            <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12">
              <div className="bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] rounded-xl p-6 sm:p-8 space-y-4 max-w-2xl">
                <div className="flex items-center gap-3 text-[var(--colors-ink)]">
                  <div className="w-10 h-10 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-[var(--colors-muted)]" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-[var(--colors-ink)]">
                      {t.activity.fallbackTitle}
                    </h2>
                    <p className="font-body text-xs text-[var(--colors-muted)]">
                      {t.activity.fallbackDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <a
                    href="https://github.com/xsiphr/Oxiv/commits/main"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--colors-ink)] text-[var(--colors-canvas)] font-mono text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span>{t.activity.viewOnGithub}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] font-mono text-xs text-[var(--colors-ink)] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Heatmap Section */}
            <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
              <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--colors-ink)] tracking-tight">
                      {t.activity.heatmapTitle}
                    </h2>
                    <p className="font-body text-xs text-[var(--colors-muted)] mt-1">
                      {t.activity.heatmapSubtitle}
                    </p>
                  </div>

                  {/* Legend (Monochrome Opacity Levels) */}
                  <div className="flex items-center gap-2 font-mono text-xs text-[var(--colors-muted)] self-start sm:self-auto select-none">
                    <span>{t.activity.legendLess}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-xs bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)]/60" />
                      <div className="w-3 h-3 rounded-xs bg-[var(--colors-ink)]/20 border border-[var(--colors-ink)]/30" />
                      <div className="w-3 h-3 rounded-xs bg-[var(--colors-ink)]/45 border border-[var(--colors-ink)]/55" />
                      <div className="w-3 h-3 rounded-xs bg-[var(--colors-ink)]/75 border border-[var(--colors-ink)]/85" />
                      <div className="w-3 h-3 rounded-xs bg-[var(--colors-ink)] border border-[var(--colors-ink)]" />
                    </div>
                    <span>{t.activity.legendMore}</span>
                  </div>
                </div>

                {/* Heatmap Matrix Card */}
                <div className="bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] rounded-xl p-4 sm:p-6 shadow-xs overflow-x-auto relative">
                  <div dir="ltr" className="min-w-[640px] flex flex-col space-y-2">
                    {/* Month headers row */}
                    <div className="flex items-center text-[10px] font-mono text-[var(--colors-muted)] pl-7">
                      {weeks.map((_, idx) => {
                        const header = monthHeaders.find((h) => h.colIndex === idx);
                        return (
                          <div key={idx} className="w-4 sm:w-4.5 mx-0.5 text-center">
                            {header ? header.label : ''}
                          </div>
                        );
                      })}
                    </div>

                    {/* Grid with Day Labels + Cells */}
                    <div className="flex">
                      {/* Day of week labels */}
                      <div className="flex flex-col justify-between pr-2 text-[9px] font-mono text-[var(--colors-muted)] select-none w-7 text-right">
                        {DAY_LABELS.map((day, dIdx) => (
                          <span key={dIdx} className="h-4 leading-4">
                            {day}
                          </span>
                        ))}
                      </div>

                      {/* 20 Week Columns */}
                      <div className="flex gap-1">
                        {weeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-col gap-1">
                            {week.map((cell) => {
                              const tooltipText = t.activity.commitsTooltip(
                                cell.count,
                                cell.dateStr
                              );
                              return (
                                <div
                                  key={cell.dateStr}
                                  title={tooltipText}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredCell({
                                      dateStr: cell.dateStr,
                                      count: cell.count,
                                      x: rect.left + rect.width / 2,
                                      y: rect.top,
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredCell(null)}
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs transition-all ${getIntensityClass(
                                    cell.intensity,
                                    cell.isFuture
                                  )}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Commit Ledger Section */}
            <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
              <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-6">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--colors-ink)] tracking-tight">
                    {t.activity.historyTitle}
                  </h2>
                  <p className="font-body text-xs text-[var(--colors-muted)] mt-1">
                    Direct cryptographic history from the repository master branch.
                  </p>
                </div>

                {/* Ledger Container */}
                <div
                  dir="ltr"
                  className="rounded-xl border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] shadow-xs divide-y divide-dashed divide-[var(--colors-hairline)] overflow-hidden"
                >
                  {commits.map((c) => {
                    const firstLineMessage = c.commit?.message?.split('\n')[0] || 'Commit';
                    const authorName = c.author?.login || c.commit?.author?.name || 'Developer';
                    const shortHash = c.sha?.slice(0, 7) || '-------';
                    const dateFormatted = formatDate(
                      c.commit?.author?.date || c.commit?.committer?.date
                    );

                    return (
                      <div
                        key={c.sha}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--colors-surface-elevated)]/60 transition-colors group"
                      >
                        {/* Commit Title & Author */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-start gap-2.5">
                            <GitCommit className="w-4 h-4 text-[var(--colors-muted)] mt-1 shrink-0 group-hover:text-[var(--colors-ink)] transition-colors" />
                            <a
                              href={c.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-sm sm:text-[15px] font-medium text-[var(--colors-ink)] hover:underline truncate"
                              title={c.commit?.message}
                            >
                              {firstLineMessage}
                            </a>
                          </div>

                          <div className="flex items-center gap-2 pl-6 font-mono text-xs text-[var(--colors-muted)]">
                            <span>{authorName}</span>
                            <span className="opacity-40">•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 opacity-60" />
                              {dateFormatted}
                            </span>
                          </div>
                        </div>

                        {/* Commit SHA link */}
                        <div className="sm:pl-4 shrink-0 flex items-center justify-end">
                          <a
                            href={c.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs px-2.5 py-1 rounded-md bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] text-[var(--colors-ink)] flex items-center gap-1.5 transition-all shadow-2xs"
                            title={`Inspect commit ${shortHash} on GitHub`}
                          >
                            <span>{shortHash}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}

export default ActivityView;
