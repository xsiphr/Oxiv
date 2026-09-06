'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { History, Trash2, Copy, Check, CornerDownLeft, Filter, AlertTriangle } from 'lucide-react';
import { SiTiktok, SiInstagram, SiPinterest, SiX, SiFacebook, SiYoutube } from 'react-icons/si';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Oxi } from '@/components/ui/Oxi';
import { OxiPageLoader } from '@/components/ui/OxiPageLoader';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useI18n } from '@/lib/i18n';
import { Platform, RecentExtraction } from '@/types';

type PlatformFilter = 'all' | Platform;

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function RecentsContent() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { recents, isLoaded, removeRecent, clearRecents } = useRecentSearches();

  const [activeFilter, setActiveFilter] = useState<PlatformFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter items by selected platform
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return recents;
    return recents.filter((item) => item.platform === activeFilter);
  }, [recents, activeFilter]);

  // Unique platform list from current history
  const availablePlatforms = useMemo(() => {
    const set = new Set<Platform>();
    recents.forEach((item) => {
      if (item.platform && item.platform !== 'unknown') {
        set.add(item.platform);
      }
    });
    return Array.from(set);
  }, [recents]);

  const handleSelectRecent = (url: string) => {
    router.push(`/?url=${encodeURIComponent(url)}`);
  };

  const handleCopy = async (e: React.MouseEvent, item: RecentExtraction) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(item.url);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 1800);
      }
    } catch {
      // ignore
    }
  };

  const renderPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'tiktok':
        return <SiTiktok className="w-3.5 h-3.5 shrink-0" />;
      case 'instagram':
        return <SiInstagram className="w-3.5 h-3.5 shrink-0" />;
      case 'facebook':
        return <SiFacebook className="w-3.5 h-3.5 shrink-0" />;
      case 'pinterest':
        return <SiPinterest className="w-3.5 h-3.5 shrink-0" />;
      case 'x':
        return <SiX className="w-3.5 h-3.5 shrink-0" />;
      case 'youtube':
        return <SiYoutube className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <History className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  if (!isLoaded) {
    return <OxiPageLoader />;
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip">
      {/* 1. Sticky Navbar */}
      <Navbar />

      {/* 2. Main Body Content (Continuous Blueprint Gridline Container) */}
      <main className="flex-1 flex flex-col w-full">
        <section className="w-full flex-1 flex flex-col">
          <div className="max-w-7xl w-full mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 flex flex-col space-y-8">
            
            {/* Header Telemetry & Title */}
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--colors-ink)]">
                    {t.recents.title}
                  </h1>
                  <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] mt-2 max-w-2xl leading-relaxed">
                    {t.recents.pageSubtitle}
                  </p>
                </div>

                {/* Right Cluster: Counter & Clear All Action */}
                {recents.length > 0 && (
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-[var(--colors-muted)]">
                      [{recents.length} / 50 {t.recents.itemsCount}]
                    </span>

                    {showClearConfirm ? (
                      <div className="flex items-center gap-2 p-1 rounded-lg bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)]">
                        <span className="font-mono text-xs text-rose-500 flex items-center gap-1 px-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{t.recents.confirmClear}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            clearRecents();
                            setShowClearConfirm(false);
                          }}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs transition-colors cursor-pointer"
                        >
                          {t.recents.clear}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowClearConfirm(false)}
                          className="px-2 py-1 rounded text-[var(--colors-muted)] hover:text-[var(--colors-ink)] font-mono text-xs transition-colors cursor-pointer"
                        >
                          {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] hover:bg-[var(--colors-surface-elevated)] text-[var(--colors-muted)] hover:text-rose-500 font-mono text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.recents.clear}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Tabs (Visible when multiple platforms present) */}
            {recents.length > 0 && availablePlatforms.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed border-[var(--colors-hairline)]">
                <span className="font-mono text-xs text-[var(--colors-muted)] flex items-center gap-1 me-1">
                  <Filter className="w-3 h-3" />
                </span>
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`font-mono text-xs px-3 py-1 rounded-full transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] font-semibold shadow-xs'
                      : 'bg-[var(--colors-surface-card)] text-[var(--colors-muted)] hover:text-[var(--colors-ink)] border border-[var(--colors-hairline)]'
                  }`}
                >
                  {t.recents.filterAll} ({recents.length})
                </button>
                {availablePlatforms.map((plat) => {
                  const count = recents.filter((r) => r.platform === plat).length;
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setActiveFilter(plat)}
                      className={`font-mono text-xs px-3 py-1 rounded-full transition-all capitalize inline-flex items-center gap-1.5 cursor-pointer ${
                        activeFilter === plat
                          ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] font-semibold shadow-xs'
                          : 'bg-[var(--colors-surface-card)] text-[var(--colors-muted)] hover:text-[var(--colors-ink)] border border-[var(--colors-hairline)]'
                      }`}
                    >
                      {renderPlatformIcon(plat)}
                      <span>{plat}</span>
                      <span className="opacity-75 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Content Body: Empty State OR Populated Ledger */}
            {recents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-5 animate-fadeIn">
                <div className="select-none py-2">
                  <Oxi status="idle" size={90} className="shrink-0 opacity-80" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--colors-ink)]">
                    {t.recents.emptyTitle}
                  </h2>
                  <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] leading-relaxed">
                    {t.recents.emptyDesc}
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 font-mono text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer mt-2"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  <span>{t.recents.extractNow}</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 animate-fadeIn flex-1">
                {filteredItems.map((item) => {
                  const isCopied = copiedId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectRecent(item.url)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectRecent(item.url);
                        }
                      }}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] hover:bg-[var(--colors-surface-elevated)] transition-all cursor-pointer shadow-xs"
                    >
                      {/* Left: Platform badge + Title + Raw URL */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-[var(--colors-surface-elevated)] group-hover:bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] shrink-0 transition-colors">
                          {renderPlatformIcon(item.platform)}
                          <span>{item.platform}</span>
                        </span>

                        <div className="min-w-0 flex-1 space-y-1">
                          <h3
                            title={item.title}
                            className="font-body text-xs sm:text-sm font-semibold text-[var(--colors-ink)] truncate leading-snug"
                          >
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--colors-muted)]">
                            <span className="truncate max-w-xs sm:max-w-md opacity-80" dir="ltr">
                              {item.url}
                            </span>
                            {item.timestamp && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="shrink-0">{formatRelativeTime(item.timestamp)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions Cluster */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, item)}
                          title={t.recents.copyUrl}
                          className="p-2 rounded-lg border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] hover:bg-[var(--colors-surface-elevated)] text-[var(--colors-muted)] hover:text-[var(--colors-ink)] font-mono text-xs transition-colors cursor-pointer shadow-xs"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Re-extract Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRecent(item.url);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 font-mono text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          <CornerDownLeft className="w-3 h-3" />
                          <span>{t.recents.reExtract}</span>
                        </button>

                        {/* Delete Single Item */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecent(item.id);
                          }}
                          title={t.recents.deleteItem}
                          className="p-2 rounded-lg border border-transparent hover:border-[var(--colors-hairline)] hover:bg-[var(--colors-surface-card)] text-[var(--colors-muted)] hover:text-rose-500 font-mono text-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </section>
      </main>

      {/* 3. Global Seamless Connected Footer */}
      <Footer />
    </div>
  );
}
