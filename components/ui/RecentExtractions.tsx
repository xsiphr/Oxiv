'use client';

import React, { useState } from 'react';
import { X, History } from 'lucide-react';
import { SiTiktok, SiInstagram, SiPinterest, SiX, SiFacebook, SiYoutube } from 'react-icons/si';
import { Platform, RecentExtraction } from '@/types';
import { useI18n } from '@/lib/i18n';

interface RecentExtractionsProps {
  recents: RecentExtraction[];
  onSelect: (url: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const INITIAL_VISIBLE_COUNT = 2;

export function RecentExtractions({
  recents,
  onSelect,
  onRemove,
  onClear,
}: RecentExtractionsProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!recents || recents.length === 0) {
    return null;
  }

  const displayedItems = isExpanded ? recents : recents.slice(0, INITIAL_VISIBLE_COUNT);
  const remainingCount = recents.length - INITIAL_VISIBLE_COUNT;

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
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl px-4 mt-8 animate-fadeIn">
      <div className="border border-dashed border-[var(--colors-hairline)] rounded-xl bg-[var(--colors-surface-card)]/50 p-3 sm:p-4 backdrop-blur-xs">
        {/* Top Actions Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-dashed border-[var(--colors-hairline)]">
          <div className="flex items-center gap-1.5 text-[var(--colors-muted)]">
            <History className="w-3.5 h-3.5" />
            <span className="font-display font-semibold text-sm tracking-tight text-[var(--colors-ink)]">
              {t.recents.title}
            </span>
            <span className="font-mono text-[10px] text-[var(--colors-muted)] mx-1 px-1.5 py-0.2 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)]">
              {recents.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="font-mono text-xs text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-[var(--colors-surface-elevated)]"
          >
            [{t.recents.clear}]
          </button>
        </div>

        {/* Scrollable Item Rows List on Expansion (Displays 4 items comfortably) */}
        <div
          className={`flex flex-col gap-1.5 ${
            isExpanded
              ? 'max-h-[170px] overflow-y-auto pr-1 custom-scrollbar'
              : ''
          }`}
        >
          {displayedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item.url)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(item.url);
                }
              }}
              className="group flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg bg-[var(--colors-surface-card)] hover:bg-[var(--colors-surface-elevated)] transition-all cursor-pointer text-left shadow-xs shrink-0"
            >
              {/* Left Cluster: Platform Tag & Truncated Title */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] bg-[var(--colors-surface-elevated)] group-hover:bg-[var(--colors-surface-card)] px-2 py-0.5 rounded border border-[var(--colors-hairline)] shrink-0 transition-colors">
                  {renderPlatformIcon(item.platform)}
                  <span>{item.platform}</span>
                </span>

                <span
                  title={item.title}
                  className="font-body text-xs text-[var(--colors-ink)] truncate max-w-xs sm:max-w-md opacity-90 group-hover:opacity-100 transition-opacity"
                >
                  {item.title}
                </span>
              </div>

              {/* Right: Remove Single Item Action */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                aria-label={`Remove ${item.title} from recents`}
                className="p-1 rounded text-[var(--colors-muted)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-elevated)] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Expansion / Collapse Monospace Toggle */}
        {recents.length > INITIAL_VISIBLE_COUNT && (
          <div className="flex justify-center mt-2.5 pt-2 border-t border-dashed border-[var(--colors-hairline)]">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="font-mono text-xs text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-pointer px-2 py-1 rounded hover:bg-[var(--colors-surface-elevated)]"
            >
              {isExpanded ? `[- ${t.recents.collapse}]` : `[+${remainingCount} ${t.recents.more}]`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
