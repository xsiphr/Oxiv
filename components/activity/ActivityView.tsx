'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  GitCommit,
  Calendar,
  AlertCircle,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
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

const WEEKS_COUNT = 53; // GitHub standard 52-53 weeks
const CELL_SIZE = 10;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP; // 13px
const DAY_LABEL_WIDTH = 28;
const MONTH_LABEL_HEIGHT = 18;
const SVG_WIDTH = DAY_LABEL_WIDTH + WEEKS_COUNT * CELL_STEP; // 717px
const SVG_HEIGHT = MONTH_LABEL_HEIGHT + 7 * CELL_STEP; // 109px
const INITIAL_VISIBLE_COMMITS = 5;

export function ActivityView({ commits, error }: ActivityViewProps) {
  const { t, locale } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Group commits by YYYY-MM-DD
  const commitCountByDate: Record<string, number> = {};
  commits.forEach((c) => {
    const rawDate = c.commit?.author?.date || c.commit?.committer?.date;
    if (rawDate) {
      const key = rawDate.slice(0, 10);
      commitCountByDate[key] = (commitCountByDate[key] || 0) + 1;
    }
  });

  // Calculate 53 weeks ending on current Saturday
  const today = new Date();
  const endDay = new Date(today);
  endDay.setDate(today.getDate() + (6 - today.getDay()));
  endDay.setHours(23, 59, 59, 999);

  const totalDays = WEEKS_COUNT * 7;
  const startDay = new Date(endDay);
  startDay.setDate(endDay.getDate() - totalDays + 1);
  startDay.setHours(0, 0, 0, 0);

  interface DayCell {
    dateStr: string;
    dateObj: Date;
    count: number;
    intensity: number; // 0..4
    isFuture: boolean;
    col: number;
    row: number;
  }

  const weeks: DayCell[][] = [];
  const monthLabels: Array<{ label: string; x: number }> = [];

  let cur = new Date(startDay);
  let lastMonth = -1;
  let lastMonthCol = -3;

  for (let w = 0; w < WEEKS_COUNT; w++) {
    const week: DayCell[] = [];
    const firstDayOfWeek = new Date(cur);

    // If month changes and enough gap from last label
    if (firstDayOfWeek.getMonth() !== lastMonth && w - lastMonthCol >= 2) {
      lastMonth = firstDayOfWeek.getMonth();
      lastMonthCol = w;
      const monthName = firstDayOfWeek.toLocaleString('en-US', { month: 'short' });
      monthLabels.push({
        label: monthName,
        x: DAY_LABEL_WIDTH + w * CELL_STEP,
      });
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
        if (count >= 5) intensity = 4;
        else if (count >= 3) intensity = 3;
        else if (count >= 2) intensity = 2;
        else if (count >= 1) intensity = 1;
      }

      week.push({
        dateStr: key,
        dateObj: new Date(cur),
        count,
        intensity,
        isFuture,
        col: w,
        row: d,
      });

      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

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

  const handleCellMouseEnter = (
    e: React.MouseEvent<SVGRectElement>,
    cell: DayCell
  ) => {
    if (cell.isFuture || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();

    const tooltipText = t.activity.commitsTooltip(cell.count, cell.dateStr);

    setTooltip({
      text: tooltipText,
      x: cellRect.left - containerRect.left + CELL_SIZE / 2,
      y: cellRect.top - containerRect.top,
    });
  };

  const handleCellMouseLeave = () => {
    setTooltip(null);
  };

  const displayedCommits = isExpanded
    ? commits
    : commits.slice(0, INITIAL_VISIBLE_COMMITS);
  const remainingCount = Math.max(0, commits.length - INITIAL_VISIBLE_COMMITS);

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip">
      {/* 1. Header Navbar (Unchanged single GitHub icon linking to /activity) */}
      <Navbar />

      {/* 2. Main Content */}
      <main className="flex-1 flex flex-col w-full">
        {/* Top Header Navigation Bar */}
        <div className="w-full border-b border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
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
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] hover:bg-[var(--colors-surface-elevated)] text-[var(--colors-ink)] font-mono text-xs transition-all shadow-xs"
            >
              <SiGithub className="w-4 h-4" />
              <span className="hidden sm:inline">{t.activity.viewOnGithub}</span>
              <span className="sm:hidden">GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Hero Header */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-mono text-[11px] font-semibold tracking-widest text-[var(--colors-muted)] uppercase bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] px-2.5 py-1 rounded-md">
                xsiphr/Oxiv
              </span>
              <span className="font-mono text-xs text-[var(--colors-body)]">
                {t.activity.totalCommits(commits.length)}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--colors-ink)] tracking-tight">
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
            {/* Rebuilt Contribution Heatmap Section (GitHub Style) */}
            <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
              <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--colors-ink)] tracking-tight">
                      {t.activity.heatmapTitle}
                    </h2>
                    <p className="font-body text-xs text-[var(--colors-muted)] mt-0.5">
                      {t.activity.heatmapSubtitle}
                    </p>
                  </div>

                  {/* Heatmap Swatches Legend */}
                  <div className="flex items-center gap-2 font-mono text-xs text-[var(--colors-muted)] self-start sm:self-auto select-none">
                    <span>{t.activity.legendLess}</span>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-[2px]"
                        style={{
                          backgroundColor: 'var(--heatmap-l0)',
                          border: '1px solid var(--heatmap-l0-border)',
                        }}
                        title="0 commits"
                      />
                      <div
                        className="w-3 h-3 rounded-[2px]"
                        style={{ backgroundColor: 'var(--heatmap-l1)' }}
                        title="1 commit"
                      />
                      <div
                        className="w-3 h-3 rounded-[2px]"
                        style={{ backgroundColor: 'var(--heatmap-l2)' }}
                        title="2 commits"
                      />
                      <div
                        className="w-3 h-3 rounded-[2px]"
                        style={{ backgroundColor: 'var(--heatmap-l3)' }}
                        title="3-4 commits"
                      />
                      <div
                        className="w-3 h-3 rounded-[2px]"
                        style={{ backgroundColor: 'var(--heatmap-l4)' }}
                        title="5+ commits"
                      />
                    </div>
                    <span>{t.activity.legendMore}</span>
                  </div>
                </div>

                {/* Heatmap Card with Horizontal Scrolling for Mobile */}
                <div
                  ref={containerRef}
                  className="relative bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] rounded-xl p-4 sm:p-6 shadow-xs"
                >
                  {/* Floating tooltip on hover */}
                  {tooltip && (
                    <div
                      style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -120%)',
                      }}
                      className="pointer-events-none absolute z-30 px-2.5 py-1 rounded bg-[var(--colors-ink)] text-[var(--colors-canvas)] font-mono text-[11px] font-medium shadow-lg whitespace-nowrap animate-fadeIn"
                    >
                      {tooltip.text}
                    </div>
                  )}

                  {/* Horizontally scrollable wrapper */}
                  <div className="overflow-x-auto overflow-y-hidden pb-1 -mx-1 px-1 scrollbar-thin">
                    <div dir="ltr" className="min-w-fit">
                      <svg
                        width={SVG_WIDTH}
                        height={SVG_HEIGHT}
                        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                        className="overflow-visible select-none max-w-none block"
                      >
                        {/* Month labels along the top */}
                        {monthLabels.map((m, idx) => (
                          <text
                            key={idx}
                            x={m.x}
                            y={11}
                            className="font-mono text-[10px] fill-[var(--colors-muted)]"
                          >
                            {m.label}
                          </text>
                        ))}

                        {/* Day of week labels on left (Mon, Wed, Fri) */}
                        <text
                          x={0}
                          y={MONTH_LABEL_HEIGHT + 1 * CELL_STEP + 8}
                          className="font-mono text-[9px] fill-[var(--colors-muted)]"
                        >
                          Mon
                        </text>
                        <text
                          x={0}
                          y={MONTH_LABEL_HEIGHT + 3 * CELL_STEP + 8}
                          className="font-mono text-[9px] fill-[var(--colors-muted)]"
                        >
                          Wed
                        </text>
                        <text
                          x={0}
                          y={MONTH_LABEL_HEIGHT + 5 * CELL_STEP + 8}
                          className="font-mono text-[9px] fill-[var(--colors-muted)]"
                        >
                          Fri
                        </text>

                        {/* Weeks columns & Day rects */}
                        {weeks.map((week, wIdx) => (
                          <g
                            key={wIdx}
                            transform={`translate(${DAY_LABEL_WIDTH + wIdx * CELL_STEP}, ${MONTH_LABEL_HEIGHT})`}
                          >
                            {week.map((cell) => {
                              let fillColor = 'var(--heatmap-l0)';
                              let strokeColor: string | undefined =
                                'var(--heatmap-l0-border)';

                              if (cell.intensity === 1) {
                                fillColor = 'var(--heatmap-l1)';
                                strokeColor = undefined;
                              } else if (cell.intensity === 2) {
                                fillColor = 'var(--heatmap-l2)';
                                strokeColor = undefined;
                              } else if (cell.intensity === 3) {
                                fillColor = 'var(--heatmap-l3)';
                                strokeColor = undefined;
                              } else if (cell.intensity === 4) {
                                fillColor = 'var(--heatmap-l4)';
                                strokeColor = undefined;
                              }

                              const yPos = cell.row * CELL_STEP;

                              return (
                                <rect
                                  key={cell.dateStr}
                                  x={0}
                                  y={yPos}
                                  width={CELL_SIZE}
                                  height={CELL_SIZE}
                                  rx={2}
                                  ry={2}
                                  fill={fillColor}
                                  stroke={strokeColor}
                                  strokeWidth={strokeColor ? 1 : 0}
                                  opacity={cell.isFuture ? 0.25 : 1}
                                  className={
                                    cell.isFuture
                                      ? 'cursor-default'
                                      : 'cursor-pointer hover:stroke-[var(--colors-ink)] hover:stroke-[1.5px] transition-all'
                                  }
                                  onMouseEnter={(e) =>
                                    handleCellMouseEnter(e, cell)
                                  }
                                  onMouseLeave={handleCellMouseLeave}
                                >
                                  <title>
                                    {t.activity.commitsTooltip(
                                      cell.count,
                                      cell.dateStr
                                    )}
                                  </title>
                                </rect>
                              );
                            })}
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Commit History Ledger Section with "Show more" pagination */}
            <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
              <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
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
                  className="rounded-xl border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] shadow-xs overflow-hidden"
                >
                  <div className="divide-y divide-dashed divide-[var(--colors-hairline)]">
                    {displayedCommits.map((c) => {
                      const firstLineMessage =
                        c.commit?.message?.split('\n')[0] || 'Commit';
                      const authorName =
                        c.author?.login || c.commit?.author?.name || 'Developer';
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

                  {/* Show more / Show less Toggle Bar */}
                  {commits.length > INITIAL_VISIBLE_COMMITS && (
                    <div className="p-3 bg-[var(--colors-surface-card)] text-center border-t border-dashed border-[var(--colors-hairline)]">
                      <button
                        type="button"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        className="font-mono text-xs text-[var(--colors-muted)] hover:text-[var(--colors-ink)] px-4 py-2 rounded-lg hover:bg-[var(--colors-surface-elevated)] transition-colors inline-flex items-center gap-2 cursor-pointer border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] select-none"
                      >
                        <span>
                          {isExpanded
                            ? t.activity.showLess
                            : t.activity.showMore(remainingCount)}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  )}
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
