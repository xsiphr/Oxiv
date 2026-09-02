'use client';

import React, { useState, useEffect } from 'react';
import { TriangleAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { ExtractionError } from '@/types';
import { useI18n } from '@/lib/i18n';

interface DiagnosticCardProps {
  error: ExtractionError;
  onReset: () => void;
  onRetry: () => void;
}

export function DiagnosticCard({ error, onReset, onRetry }: DiagnosticCardProps) {
  const { t } = useI18n();
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
          title: t.diagnostic.titles.notYetSupported,
          description:
            error.message || t.diagnostic.descriptions.pipelinePending(error.platformName),
        };
      case 'UNSUPPORTED_PLATFORM':
        return {
          title: t.diagnostic.titles.notYetSupported,
          description:
            error.message || t.diagnostic.descriptions.unsupportedPlatform(error.platformName),
        };
      case 'INVALID_URL':
        return {
          title: t.diagnostic.titles.unrecognizedLink,
          description: error.message || t.diagnostic.descriptions.invalidUrl,
        };
      case 'MEDIA_UNREACHABLE':
        return {
          title: t.diagnostic.titles.mediaUnreachable,
          description: error.message || t.diagnostic.descriptions.mediaUnreachable,
        };
      case 'GATEWAY_TIMEOUT':
        return {
          title: t.diagnostic.titles.gatewayTimeout,
          description: error.message || t.diagnostic.descriptions.gatewayTimeout,
        };
      case 'RATE_LIMITED':
        return {
          title: t.diagnostic.titles.rateLimited,
          description: error.message || t.diagnostic.descriptions.rateLimited,
        };
      default:
        return {
          title: t.diagnostic.titles.extractionFailed,
          description: error.message || t.diagnostic.descriptions.extractionFailed,
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
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--colors-muted)] rtl:rotate-180" />
            <span>{t.diagnostic.tryAnother}</span>
          </button>

          {!isAmber && (
            <button
              type="button"
              onClick={handleRetryClick}
              disabled={retryCooldown}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 font-body text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retryCooldown ? 'animate-spin' : ''}`} />
              <span>{retryCooldown ? t.diagnostic.waiting : t.diagnostic.retry}</span>
            </button>
          )}
        </div>

        <span className="font-mono text-[11px] text-[var(--colors-muted)] hidden sm:inline-block">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[10px] text-[var(--colors-ink)]">ESC</kbd> {t.diagnostic.escReset}
        </span>
      </div>
    </div>
  );
}

export default DiagnosticCard;

