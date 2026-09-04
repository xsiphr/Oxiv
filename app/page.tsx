'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { ExtractionInput } from '@/components/ui/ExtractionInput';
import { TerminalStream, StreamStepState } from '@/components/ui/TerminalStream';
import { MediaPreview } from '@/components/media/MediaPreview';
import { DiagnosticCard } from '@/components/ui/DiagnosticCard';
import { RecentExtractions } from '@/components/ui/RecentExtractions';
import { MetricsGrid } from '@/components/sections/MetricsGrid';
import { PlatformLogoStrip } from '@/components/effects/PlatformLogoStrip';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { SupportedPlatformsSection } from '@/components/sections/SupportedPlatformsSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { ScrollVelocityStrip } from '@/components/effects/ScrollVelocityStrip';
import { FAQSection } from '@/components/sections/FAQSection';
import { Footer } from '@/components/ui/Footer';
import { ExtractionStatus, MediaResult, Platform, ExtractionError, ApiResponse } from '@/types';
import { detectPlatform } from '@/lib/platformRegistry';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useI18n } from '@/lib/i18n';

// Custom silky-smooth easing scroll with controlled duration and navbar offset
function smoothScrollTo(targetY: number, duration: number = 800) {
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

export default function Home() {
  const { t } = useI18n();
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [currentUrl, setCurrentUrl] = useState('');
  const [prefilledUrl, setPrefilledUrl] = useState<string | undefined>(undefined);
  const [currentPlatform, setCurrentPlatform] = useState<Platform>('unknown');
  const [steps, setSteps] = useState<StreamStepState[]>([]);
  const [mediaResult, setMediaResult] = useState<MediaResult | null>(null);
  const [extractionError, setExtractionError] = useState<ExtractionError | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const terminalRef = React.useRef<HTMLElement>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const errorRef = React.useRef<HTMLElement>(null);

  const { recents, isLoaded, addRecent, removeRecent, clearRecents } = useRecentSearches();

  // Gentle, cinematic auto-scroll to corresponding section during extraction lifecycle
  useEffect(() => {
    if (status === 'extracting') {
      const timer = setTimeout(() => {
        scrollToElement(terminalRef.current, 750, 80);
      }, 120);
      return () => clearTimeout(timer);
    } else if (status === 'success') {
      const timer = setTimeout(() => {
        scrollToElement(previewRef.current, 850, 76);
      }, 160);
      return () => clearTimeout(timer);
    } else if (status === 'error') {
      const timer = setTimeout(() => {
        scrollToElement(errorRef.current, 800, 76);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Force scroll to top and ensure fonts are ready with smooth progressive blueprint drawing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);

      const startTime = performance.now();
      const minDrawDuration = 480;

      const finishReady = () => {
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, minDrawDuration - elapsed);
        setTimeout(() => {
          setIsReady(true);
        }, remaining);
      };

      if (document.fonts) {
        document.fonts.ready
          .then(finishReady)
          .catch(finishReady);
      } else {
        finishReady();
      }
    }
  }, []);

  const handleExtract = async (url: string) => {
    const platform = detectPlatform(url) as Platform;
    const platformName = platform !== 'unknown' ? platform.toUpperCase() : 'MEDIA';

    setExtractionError(null);
    setMediaResult(null);
    setCurrentUrl(url);
    setCurrentPlatform(platform);
    setStatus('extracting');

    // 1. Initial 3 honest lifecycle steps
    const initialSteps: StreamStepState[] = [
      {
        key: 'RESOLVE',
        title: t.terminal.resolveTitle(platformName),
        detail: t.terminal.resolveDetail,
        status: 'in_progress',
      },
      {
        key: 'FETCH',
        title: t.terminal.fetchTitle,
        detail: t.terminal.fetchDetail(),
        status: 'waiting',
      },
      {
        key: 'READY',
        title: t.terminal.readyTitle,
        detail: t.terminal.readyDetail,
        status: 'waiting',
      },
    ];

    setSteps(initialSteps);
    const startTime = performance.now();

    try {
      // Step 1: RESOLVE completes when initiating network fetch
      const resolveLatency = Math.max(12, Math.round(performance.now() - startTime));
      setSteps([
        { ...initialSteps[0], status: 'completed', latencyMs: resolveLatency },
        { ...initialSteps[1], status: 'in_progress' },
        initialSteps[2],
      ]);

      const fetchStartTime = performance.now();
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const json: ApiResponse = await res.json();
      const fetchLatency = Math.round(performance.now() - fetchStartTime);

      if (json.success && json.data) {
        const primaryFormat = json.data.formats?.[0];
        const metaStr = primaryFormat
          ? `${primaryFormat.extension} • ${primaryFormat.size} • ${primaryFormat.quality || 'Original'}`
          : undefined;
        const dynamicDetail = t.terminal.fetchDetail(metaStr);

        // Step 2: FETCH completes with real measured latency
        setSteps([
          { ...initialSteps[0], status: 'completed', latencyMs: resolveLatency },
          {
            ...initialSteps[1],
            title: t.terminal.fetchTitle,
            detail: dynamicDetail,
            status: 'completed',
            latencyMs: fetchLatency,
          },
          { ...initialSteps[2], status: 'in_progress' },
        ]);

        // Step 3: READY finishes near-instant state transition
        await new Promise((r) => setTimeout(r, 260));
        const readyLatency = Math.max(1, Math.round(performance.now() - (fetchStartTime + fetchLatency)));

        setSteps([
          { ...initialSteps[0], status: 'completed', latencyMs: resolveLatency },
          {
            ...initialSteps[1],
            title: t.terminal.fetchTitle,
            detail: dynamicDetail,
            status: 'completed',
            latencyMs: fetchLatency,
          },
          {
            ...initialSteps[2],
            title: t.terminal.readyTitle,
            detail: t.terminal.readyDetail,
            status: 'completed',
            latencyMs: readyLatency,
          },
        ]);

        await new Promise((r) => setTimeout(r, 320));
        setMediaResult(json.data);
        setStatus('success');
        addRecent({
          url,
          title: json.data.title || json.data.description || 'Untitled Media',
          platform: json.data.platform || platform,
        });
      } else {
        // Handle structured error from API
        const errPayload: ExtractionError = (!json.success && json.error)
          ? json.error
          : {
            code: 'EXTRACTION_FAILED',
            message: 'Failed to extract media from this URL.',
            statusHint: res.status || 500,
          };

        // Step 2: FETCH step reflects failure
        setSteps([
          { ...initialSteps[0], status: 'completed', latencyMs: resolveLatency },
          {
            ...initialSteps[1],
            title: t.terminal.rejectedTitle,
            detail: `↳ [${errPayload.code}] ${errPayload.message}`,
            status: 'error',
            latencyMs: fetchLatency,
          },
          { ...initialSteps[2], status: 'waiting' },
        ]);

        setExtractionError(errPayload);

        // 600ms grace period so user can read failing step in terminal before diagnostic card displays
        await new Promise((r) => setTimeout(r, 600));
        setStatus('error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network connection failure.';
      const fallbackError: ExtractionError = {
        code: 'GATEWAY_TIMEOUT',
        message: 'Network extraction connection dropped or timed out.',
        technicalDetail: msg,
        statusHint: 504,
      };

      setSteps((prev) => [
        prev[0] || initialSteps[0],
        {
          key: 'FETCH',
          title: t.terminal.networkFailureTitle,
          detail: `↳ [GATEWAY_TIMEOUT] ${msg}`,
          status: 'error',
        },
        initialSteps[2],
      ]);

      setExtractionError(fallbackError);
      await new Promise((r) => setTimeout(r, 600));
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setMediaResult(null);
    setExtractionError(null);
    setCurrentUrl('');
    setPrefilledUrl('');
    setCurrentPlatform('unknown');
    setSteps([]);
    setResetSignal((prev) => prev + 1);
    smoothScrollTo(0, 700);
  };

  // Keyboard shortcut: Escape to reset from both success and error states
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (status === 'success' || status === 'error')) {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  if (!isReady) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip">
      {/* 1. Header Navbar (Full-width border-b) */}
      <Navbar />

      {/* 2. Main Body Content */}
      <main className="flex-1 flex flex-col w-full">
        {/* Hero Section */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col items-center justify-center">
            <ExtractionInput
              onExtract={handleExtract}
              isLoading={status === 'extracting'}
              resetSignal={resetSignal}
              externalUrl={prefilledUrl}
            />

            {/* Client-Side Recents History (Zero Retention / localStorage) */}
            {isLoaded && recents.length > 0 && (
              <RecentExtractions
                recents={recents}
                onSelect={(selectedUrl) => {
                  setPrefilledUrl(selectedUrl);
                  handleExtract(selectedUrl);
                }}
                onRemove={removeRecent}
                onClear={clearRecents}
              />
            )}
          </div>
        </section>

        {/* Real-time Extraction Terminal Stream (Kept visible after extraction) */}
        {steps.length > 0 && (
          <section ref={terminalRef} className="w-full scroll-mt-20">
            <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 pb-14 w-full animate-fadeIn">
              <TerminalStream
                steps={steps}
                url={currentUrl}
                platform={currentPlatform}
              />
            </div>
          </section>
        )}

        {/* 3. Diagnostic Card State on Error (Full-width border-t) */}
        {status === 'error' && extractionError && (
          <section ref={errorRef} className="w-full scroll-mt-20">
            <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 pb-14 w-full animate-fadeIn">
              <DiagnosticCard
                error={extractionError}
                onReset={handleReset}
                onRetry={() => handleExtract(currentUrl)}
              />
            </div>
          </section>
        )}

        {/* 4. Media Result Preview State (Full-width border-t) */}
        {status === 'success' && mediaResult && (
          <div ref={previewRef} className="w-full scroll-mt-20">
            <MediaPreview media={mediaResult} onReset={handleReset} />
          </div>
        )}

        {/* 5. Metrics & Performance Figures Grid (Full-width border-y) */}
        <MetricsGrid />

        {/* 6. Supported Platform Logo Loop Strip (Full-width border-b) */}
        <PlatformLogoStrip />

        {/* 7. How It Works (3 Steps) */}
        <HowItWorksSection />

        {/* 8. Supported Platforms & Formats */}
        <SupportedPlatformsSection />

        {/* 9. Standout Features & Differentiators */}
        <FeaturesSection />

        {/* 10. Scroll Velocity Marquee Strip */}
        <ScrollVelocityStrip texts={t.ticker} />

        {/* 10. Minimal Technical FAQ Accordion */}
        <FAQSection />
      </main>

      {/* 10. Footer (Full-width border-t) */}
      <Footer />
    </div>
  );
}
