'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  GitCommit,
  Calendar,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Check,
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
  selectedYear?: number | null;
  availableYears?: number[];
}

// Substantially sized cells that fill the card gracefully
const CELL_SIZE = 14;
const CELL_GAP = 3.5;
const CELL_STEP = CELL_SIZE + CELL_GAP; // 17.5px
const DAY_LABEL_WIDTH = 34;
const MONTH_LABEL_HEIGHT = 22;
const SVG_HEIGHT = MONTH_LABEL_HEIGHT + 7 * CELL_STEP; // 144.5px
const PAGE_SIZE = 5;

// Custom silky-smooth easing scroll with controlled duration and navbar offset (matching home page)
function smoothScrollTo(targetY: number, duration: number = 850) {
  if (typeof window === 'undefined') return;

  const startY = window.scrollY || window.pageYOffset;
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) return;

  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * easeProgress);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

const scrollToElement = (element: HTMLElement | null, duration: number = 850, offset: number = 76) => {
  if (!element || typeof window === 'undefined') return;
  const elementRect = element.getBoundingClientRect();
  const absoluteTop = elementRect.top + window.pageYOffset;
  const targetY = Math.max(0, absoluteTop - offset);
  smoothScrollTo(targetY, duration);
};

export function ActivityView({
  commits,
  error,
  selectedYear,
  availableYears = [2026],
}: ActivityViewProps) {
  const { t, locale } = useI18n();
  const router = useRouter();

  // Commit history pagination: show max 5 at a time
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const commitsSectionRef = useRef<HTMLElement>(null);

  const handleShowMore = () => {
    const nextTargetIndex = visibleCount;
    setVisibleCount((prev) => prev + PAGE_SIZE);

    // Smooth navigation downward to newly revealed commits matching home page behavior
    setTimeout(() => {
      const targetElement = document.getElementById(`commit-row-${nextTargetIndex}`);
      if (targetElement) {
        scrollToElement(targetElement, 850, 76);
      }
    }, 120);
  };

  const handleShowLess = () => {
    setVisibleCount(PAGE_SIZE);

    // Smooth scroll back to commits section header
    setTimeout(() => {
      if (commitsSectionRef.current) {
        scrollToElement(commitsSectionRef.current, 750, 80);
      }
    }, 120);
  };

  // Mobile dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Heatmap tooltip state
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();

  // Reset pagination when year changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedYear]);

  // Close mobile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group commits by YYYY-MM-DD
  const commitCountByDate: Record<string, number> = {};
  commits.forEach((c) => {
    const rawDate = c.commit?.author?.date || c.commit?.committer?.date;
    if (rawDate) {
      const key = rawDate.slice(0, 10);
      commitCountByDate[key] = (commitCountByDate[key] || 0) + 1;
    }
  });

  // Calculate calendar range
  const today = new Date();
  let startDay: Date;
  let endDay: Date;
  let weeksCount: number;

  if (selectedYear) {
    // Specific Year selected: full calendar Jan 1 to Dec 31
    const jan1 = new Date(selectedYear, 0, 1);
    startDay = new Date(jan1);
    startDay.setDate(jan1.getDate() - jan1.getDay()); // Sunday of Jan 1 week
    startDay.setHours(0, 0, 0, 0);

    const dec31 = new Date(selectedYear, 11, 31);
    endDay = new Date(dec31);
    endDay.setDate(dec31.getDate() + (6 - dec31.getDay())); // Saturday of Dec 31 week
    endDay.setHours(23, 59, 59, 999);

    const diffMs = endDay.getTime() - startDay.getTime();
    const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    weeksCount = Math.ceil(totalDays / 7);
  } else {
    // Default: Last full year rolling window (53 weeks ending on current Saturday)
    endDay = new Date(today);
    endDay.setDate(today.getDate() + (6 - today.getDay()));
    endDay.setHours(23, 59, 59, 999);

    weeksCount = 53;
    const totalDays = weeksCount * 7;
    startDay = new Date(endDay);
    startDay.setDate(endDay.getDate() - totalDays + 1);
    startDay.setHours(0, 0, 0, 0);
  }

  const svgWidth = DAY_LABEL_WIDTH + weeksCount * CELL_STEP;

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

  for (let w = 0; w < weeksCount; w++) {
    const week: DayCell[] = [];
    const firstDayOfWeek = new Date(cur);

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

      // In current year or rolling view, dates beyond today are future
      const isFuture = selectedYear
        ? selectedYear === currentYear && cur > today
        : cur > today;

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

  const displayedCommits = commits.slice(0, visibleCount);
  const remainingCount = Math.max(0, commits.length - visibleCount);
  const nextIncrement = Math.min(PAGE_SIZE, remainingCount);

  // Section title matches GitHub: "X contributions in 2026" or "X contributions in the last year"
  const contributionsHeading = selectedYear
    ? t.activity.contributionsInYear(commits.length, selectedYear)
    : t.activity.contributionsInLastYear(commits.length);

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip">
      {/* 1. Header Navbar (Unchanged) */}
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
            {/* Heatmap Section: GitHub Composition */}
            <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
              <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-4">
                {/* Header Row: Title on Left + Mobile Year Dropdown on Right */}
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--colors-ink)] tracking-tight">
                    {contributionsHeading}
                  </h2>

                  {/* Mobile Year Selector Dropdown with Arrow (Above graph, not below) */}
                  <div className="relative md:hidden shrink-0" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] font-mono text-xs text-[var(--colors-ink)] shadow-2xs cursor-pointer select-none transition-all"
                      aria-haspopup="true"
                      aria-expanded={dropdownOpen}
                    >
                      <span>
                        {selectedYear
                          ? t.activity.yearLabel(selectedYear)
                          : t.activity.yearLabel(t.activity.lastYear)}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[var(--colors-muted)] transition-transform duration-200 ${
                          dropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 z-40 w-36 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] p-1.5 shadow-xl font-mono text-xs space-y-0.5 animate-fadeIn">
                        {/* Option: Last Year (Default rolling) */}
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            router.push('/activity');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                            !selectedYear
                              ? 'bg-[var(--colors-surface-elevated)] text-[var(--colors-ink)] font-semibold'
                              : 'text-[var(--colors-muted)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-elevated)]/60'
                          }`}
                        >
                          <span>{t.activity.lastYear}</span>
                          {!selectedYear && <Check className="w-3.5 h-3.5 text-[var(--colors-ink)]" />}
                        </button>

                        {/* Specific Years */}
                        {availableYears.map((yr) => {
                          const isSelected = selectedYear === yr;
                          return (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => {
                                setDropdownOpen(false);
                                router.push(`/activity?year=${yr}`);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[var(--colors-surface-elevated)] text-[var(--colors-ink)] font-semibold'
                                  : 'text-[var(--colors-muted)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-elevated)]/60'
                              }`}
                            >
                              <span>{yr}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[var(--colors-ink)]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Split Layout: Left Heatmap Grid + Right Year Selector Column */}
                <div className="flex flex-col md:flex-row gap-5 lg:gap-6 items-start">
                  {/* Left (Main Area): Substantially sized SVG grid filling the card */}
                  <div className="flex-1 min-w-0 w-full">
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
                            width={svgWidth}
                            height={SVG_HEIGHT}
                            viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
                            className="overflow-visible select-none max-w-none block"
                          >
                            {/* Month labels along the top */}
                            {monthLabels.map((m, idx) => (
                              <text
                                key={idx}
                                x={m.x}
                                y={13}
                                className="font-mono text-[10.5px] fill-[var(--colors-muted)] font-medium"
                              >
                                {m.label}
                              </text>
                            ))}

                            {/* Day of week labels on left (Mon, Wed, Fri) */}
                            <text
                              x={0}
                              y={MONTH_LABEL_HEIGHT + 1 * CELL_STEP + 11}
                              className="font-mono text-[9.5px] fill-[var(--colors-muted)]"
                            >
                              Mon
                            </text>
                            <text
                              x={0}
                              y={MONTH_LABEL_HEIGHT + 3 * CELL_STEP + 11}
                              className="font-mono text-[9.5px] fill-[var(--colors-muted)]"
                            >
                              Wed
                            </text>
                            <text
                              x={0}
                              y={MONTH_LABEL_HEIGHT + 5 * CELL_STEP + 11}
                              className="font-mono text-[9.5px] fill-[var(--colors-muted)]"
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
                                      rx={2.5}
                                      ry={2.5}
                                      fill={fillColor}
                                      stroke={strokeColor}
                                      strokeWidth={strokeColor ? 1 : 0}
                                      opacity={cell.isFuture ? 0.35 : 1}
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

                      {/* Card Footer: Subtitle Note & Intensity Legend */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 text-xs font-mono text-[var(--colors-muted)] select-none border-t border-dashed border-[var(--colors-hairline)]">
                        <span className="text-[11px] opacity-75">
                          {selectedYear
                            ? `Full calendar year ${selectedYear}`
                            : 'Recent rolling 52-week activity'}
                        </span>

                        {/* Intensity Swatches */}
                        <div className="flex items-center gap-2">
                          <span>{t.activity.legendLess}</span>
                          <div className="flex items-center gap-1">
                            <div
                              className="w-3.5 h-3.5 rounded-[2px]"
                              style={{
                                backgroundColor: 'var(--heatmap-l0)',
                                border: '1px solid var(--heatmap-l0-border)',
                              }}
                              title="0 commits"
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-[2px]"
                              style={{ backgroundColor: 'var(--heatmap-l1)' }}
                              title="1 commit"
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-[2px]"
                              style={{ backgroundColor: 'var(--heatmap-l2)' }}
                              title="2 commits"
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-[2px]"
                              style={{ backgroundColor: 'var(--heatmap-l3)' }}
                              title="3-4 commits"
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-[2px]"
                              style={{ backgroundColor: 'var(--heatmap-l4)' }}
                              title="5+ commits"
                            />
                          </div>
                          <span>{t.activity.legendMore}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Desktop Only): Year Selector Stack (Matching GitHub Profile) */}
                  <div className="hidden md:flex md:flex-col gap-1.5 w-28 lg:w-32 shrink-0">
                    {availableYears.map((yr) => {
                      const isSelected = selectedYear === yr;
                      return (
                        <Link
                          key={yr}
                          href={isSelected ? '/activity' : `/activity?year=${yr}`}
                          className={`font-mono text-xs px-3.5 py-2 rounded-lg transition-all text-left select-none shrink-0 ${
                            isSelected
                              ? 'bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline-strong)] text-[var(--colors-ink)] font-semibold shadow-2xs'
                              : 'text-[var(--colors-muted)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-card)]'
                          }`}
                        >
                          {yr}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Commit History Ledger Section with max 5 per page increment */}
            <section
              ref={commitsSectionRef}
              className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] scroll-mt-20"
            >
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
                    {displayedCommits.map((c, index) => {
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
                          id={`commit-row-${index}`}
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

                  {/* Show more (+5) / Show less Toggle Bar */}
                  {commits.length > PAGE_SIZE && (
                    <div className="p-3 bg-[var(--colors-surface-card)] text-center border-t border-dashed border-[var(--colors-hairline)]">
                      {remainingCount > 0 ? (
                        <button
                          type="button"
                          onClick={handleShowMore}
                          className="font-mono text-xs text-[var(--colors-muted)] hover:text-[var(--colors-ink)] px-4 py-2 rounded-lg hover:bg-[var(--colors-surface-elevated)] transition-colors inline-flex items-center gap-2 cursor-pointer border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] select-none"
                        >
                          <span>{t.activity.showMore(remainingCount)}</span>
                          <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleShowLess}
                          className="font-mono text-xs text-[var(--colors-muted)] hover:text-[var(--colors-ink)] px-4 py-2 rounded-lg hover:bg-[var(--colors-surface-elevated)] transition-colors inline-flex items-center gap-2 cursor-pointer border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] select-none"
                        >
                          <span>{t.activity.showLess}</span>
                          <ChevronDown className="w-3.5 h-3.5 rotate-180 transition-transform duration-200" />
                        </button>
                      )}
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
