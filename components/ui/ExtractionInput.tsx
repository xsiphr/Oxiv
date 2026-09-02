'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clipboard, X, CornerDownLeft } from 'lucide-react';
import { PlatformBadges } from './PlatformBadges';
import { detectPlatform } from '@/lib/platformRegistry';
import { Platform } from '@/types';

interface ExtractionInputProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
  externalError?: string | null;
  resetSignal?: number;
  externalUrl?: string;
}

export function ExtractionInput({ onExtract, isLoading, externalError, resetSignal, externalUrl }: ExtractionInputProps) {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('unknown');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync externalUrl if provided (e.g. from Recents selection)
  useEffect(() => {
    if (externalUrl !== undefined) {
      setUrl(externalUrl);
      setError(null);
      const clean = externalUrl.trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
      if (clean) {
        setDetectedPlatform(detectPlatform(clean) as Platform);
      } else {
        setDetectedPlatform('unknown');
      }
    }
  }, [externalUrl]);

  // Initial autofocus on PC/desktop only (prevent soft keyboard popup on mobile)
  useEffect(() => {
    const isDesktop =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches &&
      window.innerWidth >= 768;
    if (isDesktop) {
      inputRef.current?.focus();
    }
  }, []);

  // Clear input and reset detection when New Extract / reset is triggered
  useEffect(() => {
    if (resetSignal !== undefined && resetSignal > 0) {
      setUrl('');
      setDetectedPlatform('unknown');
      setError(null);
      const isDesktop =
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: fine)').matches &&
        window.innerWidth >= 768;
      if (isDesktop) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      }
    }
  }, [resetSignal]);

  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const sanitizeUrl = (val: string): string => {
    return val.trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setError(null);
    const clean = sanitizeUrl(value);
    if (clean) {
      setDetectedPlatform(detectPlatform(clean) as Platform);
    } else {
      setDetectedPlatform('unknown');
    }
  };

  const processAndExtract = (rawText: string) => {
    const clean = sanitizeUrl(rawText);
    if (!clean) return;

    setUrl(clean);
    setError(null);

    const platform = detectPlatform(clean) as Platform;
    setDetectedPlatform(platform);

    if (platform && platform !== 'unknown') {
      onExtract(clean);
    }
  };

  const handleNativePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;
    processAndExtract(pastedText);
  };

  const handlePaste = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        processAndExtract(text);
      }
    } catch (err) {
      console.error('Clipboard access notice:', err);
      inputRef.current?.focus();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    setUrl('');
    setDetectedPlatform('unknown');
    setError(null);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeUrl(url);
    if (!clean) {
      setError('Please provide a valid social media URL.');
      inputRef.current?.focus();
      return;
    }
    setError(null);
    onExtract(clean);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Editorial Headline */}
      <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[var(--colors-ink)] text-center mb-8 sm:mb-10 max-w-4xl leading-[1.08]">
        Extract raw media effortlessly.
      </h1>

      {/* Form Container */}
      <div className="w-full max-w-2xl px-4">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] rounded-xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 focus-within:border-[var(--colors-hairline-strong)] transition-all shadow-xs w-full">
            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={handleInputChange}
              onPaste={handleNativePaste}
              placeholder="Paste link here..."
              readOnly={isLoading}
              className="font-mono text-xs sm:text-sm bg-transparent outline-none flex-1 min-w-0 text-[var(--colors-ink)] placeholder:text-[var(--colors-muted)] px-2.5 sm:px-3 disabled:opacity-50 read-only:opacity-60"
            />

            {/* Quick Actions (Clear / Paste) */}
            {url ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                aria-label="Clear input"
                className="p-2 text-[var(--colors-muted)] hover:text-[var(--colors-ink)] rounded-lg hover:bg-[var(--colors-surface-elevated)] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                aria-label="Paste link from clipboard"
                className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-body font-semibold text-[var(--colors-ink)] p-2 sm:px-3.5 sm:py-2 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] hover:bg-[var(--colors-surface-card)] transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
              >
                <Clipboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--colors-muted)] shrink-0" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              aria-label="Extract media"
              className="bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 active:scale-95 p-2 sm:px-5 sm:py-2.5 rounded-lg font-body font-semibold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer"
            >
              <span className="hidden sm:inline">{isLoading ? 'Extracting...' : 'Extract'}</span>
              <CornerDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 shrink-0" />
            </button>
          </div>
        </form>

        {/* Error notice if any */}
        {error && (
          <p className="font-mono text-xs text-[var(--colors-muted)] text-center mt-2.5">
            ⚠ {error}
          </p>
        )}

        {/* Auto-detecting Source Badges */}
        <div className="mt-6">
          <PlatformBadges activePlatform={detectedPlatform} />
        </div>
      </div>
    </div>
  );
}
