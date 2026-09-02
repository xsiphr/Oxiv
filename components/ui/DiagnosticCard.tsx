'use client';

import React, { useState, useEffect } from 'react';
import { TriangleAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { ExtractionError } from '@/types';

interface DiagnosticCardProps {
  error: ExtractionError;
  onReset: () => void;
  onRetry: () => void;
}

export function DiagnosticCard({ error, onReset, onRetry }: DiagnosticCardProps) {
  const [retryCooldown, setRetryCooldown] = useState(false);

  // 2s Cooldown protection for rate-limited retries
  useEffect(() => {
    if (error.code === 'RATE_LIMITED') {
      setRetryCooldown(true);
      const timer = setTimeout(() => {
        setRetryCooldown(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    setRetryCooldown(false);
  }, [error.code]);

  const handleRetryClick = () => {
    if (retryCooldown) return;
    if (error.code === 'RATE_LIMITED') {
      setRetryCooldown(true);
      setTimeout(() => setRetryCooldown(false), 2000);
    }
    onRetry();
  };

  const isAmber = error.code === 'PIPELINE_PENDING' || error.code === 'UNSUPPORTED_PLATFORM';

  // Human-readable titles & descriptions
  const getDisplayContent = () => {
    switch (error.code) {
      case 'PIPELINE_PENDING':
        return {
          title: 'Not Yet Supported',
          description:
            error.message ||
            `${error.platformName || 'This platform'} support is in active deployment.`,
        };
      case 'UNSUPPORTED_PLATFORM':
        return {
          title: 'Not Yet Supported',
          description:
            error.message ||
            `Oxiv doesn't support ${error.platformName || 'this platform'} links.`,
        };
      case 'INVALID_URL':
        return {
          title: 'Unrecognized Link',
          description:
            error.message ||
            "This doesn't look like a valid link. Check the URL and try again.",
        };
      case 'MEDIA_UNREACHABLE':
        return {
          title: 'Media Unreachable',
          description:
            error.message ||
            'This post is private, deleted, or restricted by the platform.',
        };
      case 'GATEWAY_TIMEOUT':
        return {
          title: 'Connection Timed Out',
          description:
            error.message ||
            'Could not establish a stable connection with the upstream media server. Please try again.',
        };
      case 'RATE_LIMITED':
        return {
          title: 'Too Many Requests',
          description:
            error.message ||
            'The upstream provider is temporarily rate-limiting requests. Please wait a moment before retrying.',
        };
      default:
        return {
          title: 'Extraction Failed',
          description: error.message || 'An unexpected issue occurred while extracting this media.',
        };
    }
  };

  const { title, description } = getDisplayContent();

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] p-6 sm:p-7 shadow-xs transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Single purposeful colored warning indicator */}
        <div
          className={`p-2.5 rounded-lg shrink-0 ${
            isAmber
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
          }`}
        >
          <TriangleAlert className="w-5 h-5" />
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <h2 className="font-display text-2xl font-bold text-[var(--colors-ink)] tracking-tight">
            {title}
          </h2>
          <p className="font-body text-sm text-[var(--colors-body)] leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-6 pt-5 border-t border-dashed border-[var(--colors-hairline)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] text-[var(--colors-ink)] font-body text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--colors-muted)]" />
            <span>Try Another Link</span>
          </button>

          {!isAmber && (
            <button
              type="button"
              onClick={handleRetryClick}
              disabled={retryCooldown}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 font-body text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retryCooldown ? 'animate-spin' : ''}`} />
              <span>{retryCooldown ? 'Waiting (2s)...' : 'Retry'}</span>
            </button>
          )}
        </div>

        <span className="font-mono text-[11px] text-[var(--colors-muted)] hidden sm:inline-block">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[10px] text-[var(--colors-ink)]">ESC</kbd> to reset
        </span>
      </div>
    </div>
  );
}
