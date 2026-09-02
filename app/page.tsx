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
import { ScrollVelocityStrip } from '@/components/effects/ScrollVelocityStrip';
import { FAQSection } from '@/components/sections/FAQSection';
import { Footer } from '@/components/ui/Footer';
import { ExtractionStatus, MediaResult, Platform, ExtractionError, ApiResponse } from '@/types';
import { detectPlatform } from '@/lib/platformRegistry';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [currentUrl, setCurrentUrl] = useState('');
  const [prefilledUrl, setPrefilledUrl] = useState<string | undefined>(undefined);
  const [currentPlatform, setCurrentPlatform] = useState<Platform>('unknown');
  const [steps, setSteps] = useState<StreamStepState[]>([]);
  const [mediaResult, setMediaResult] = useState<MediaResult | null>(null);
  const [extractionError, setExtractionError] = useState<ExtractionError | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const { recents, isLoaded, addRecent, removeRecent, clearRecents } = useRecentSearches();

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
        title: `Resolving target ${platformName} endpoint`,
        detail: '↳ Locating direct media resource URL',
        status: 'in_progress',
      },
      {
        key: 'FETCH',
        title: 'Original media payload retrieved',
        detail: '↳ Fetching direct unwatermarked source stream',
        status: 'waiting',
      },
      {
        key: 'READY',
        title: 'Direct download stream ready',
        detail: '↳ Media stream ready for client download',
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
        const dynamicDetail = primaryFormat
          ? `↳ Media detected (${primaryFormat.extension} • ${primaryFormat.size} • ${primaryFormat.quality || 'Original'})`
          : '↳ Direct unwatermarked media stream ready';

        // Step 2: FETCH completes with real measured latency
        setSteps([
          { ...initialSteps[0], status: 'completed', latencyMs: resolveLatency },
          {
            ...initialSteps[1],
            title: 'Original media payload retrieved',
            detail: dynamicDetail,
            status: 'completed',
            latencyMs: fetchLatency,
          },
          { ...initialSteps[2], status: 'in_progress' },
        ]);

        // Step 3: READY finishes near-instant state transition
        await new Promise((r) => setTimeout(r, 240));
        const readyLatency = Math.max(1, Math.round(performance.now() - (fetchStartTime + fetchLatency)));

        setSteps([
          { ...initialSteps[0], status: 'completed', latencyMs: resolveLatency },
          {
            ...initialSteps[1],
            title: 'Original media payload retrieved',
            detail: dynamicDetail,
            status: 'completed',
            latencyMs: fetchLatency,
          },
          {
            ...initialSteps[2],
            title: 'Direct download stream ready',
            detail: '↳ Media stream ready for client download',
            status: 'completed',
            latencyMs: readyLatency,
          },
        ]);

        await new Promise((r) => setTimeout(r, 200));
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
            title: 'Extraction pipeline rejected request',
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
          title: 'Extraction network failure',
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

        {/* Real-time Extraction Terminal Stream */}
        {status === 'extracting' && steps.length > 0 && (
          <section className="w-full">
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
          <section className="w-full">
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
          <MediaPreview media={mediaResult} onReset={handleReset} />
        )}

        {/* 5. Metrics & Performance Figures Grid (Full-width border-y) */}
        <MetricsGrid />

        {/* 6. Supported Platform Logo Loop Strip (Full-width border-b) */}
        <PlatformLogoStrip />

        {/* 7. How It Works (3 Steps) */}
        <HowItWorksSection />

        {/* 8. Supported Platforms & Formats */}
        <SupportedPlatformsSection />

        {/* 9. Scroll Velocity Marquee Strip */}
        <ScrollVelocityStrip />

        {/* 10. Minimal Technical FAQ Accordion */}
        <FAQSection />
      </main>

      {/* 10. Footer (Full-width border-t) */}
      <Footer />
    </div>
  );
}
