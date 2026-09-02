'use client';

import React from 'react';

export function PageSkeleton() {
  return (
    <div
      className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip select-none"
      aria-busy="true"
      aria-label="Loading page..."
    >
      {/* 1. Header Navbar (Static Gridline Borders) */}
      <header className="sticky top-0 z-50 w-full glass-header border-b border-dashed border-[var(--colors-hairline)]">
        <div
          style={{ animationDelay: '0ms' }}
          className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between animate-content-cascade"
        >
          <div className="w-20 sm:w-24 h-7 rounded-md bg-[var(--colors-surface-elevated)] animate-skeleton" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--colors-surface-elevated)] animate-skeleton" />
            <div className="w-9 h-9 rounded-xl bg-[var(--colors-surface-elevated)] animate-skeleton" />
          </div>
        </div>
      </header>

      {/* 2. Main Content Body (Static Gridline Borders) */}
      <main className="flex-1 flex flex-col w-full">
        {/* Hero Section */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col items-center justify-center">
            <div
              style={{ animationDelay: '70ms' }}
              className="w-full flex flex-col items-center animate-content-cascade"
            >
              {/* Headline Skeletons */}
              <div className="w-full flex flex-col items-center mb-8 sm:mb-10 max-w-4xl gap-3">
                <div className="w-4/5 max-w-2xl h-10 sm:h-12 md:h-14 rounded-lg bg-[var(--colors-surface-elevated)] animate-skeleton" />
                <div className="w-3/5 max-w-lg h-10 sm:h-12 md:h-14 rounded-lg bg-[var(--colors-surface-elevated)] animate-skeleton" />
              </div>

              {/* Input Bar Envelope */}
              <div className="w-full max-w-2xl px-4 flex flex-col items-center">
                <div className="w-full h-14 bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] rounded-xl p-2 flex items-center justify-between gap-2 shadow-xs">
                  <div className="w-36 sm:w-48 h-5 rounded bg-[var(--colors-surface-elevated)] animate-skeleton ml-2" />
                  <div className="flex items-center gap-2">
                    <div className="w-16 sm:w-20 h-9 rounded-lg bg-[var(--colors-surface-elevated)] animate-skeleton" />
                    <div className="w-20 sm:w-24 h-9 rounded-lg bg-[var(--colors-surface-elevated)] animate-skeleton" />
                  </div>
                </div>

                {/* Platform Badges Row Skeletons (4 Top, 2 Bottom) */}
                <div className="mt-6 flex flex-col items-center justify-center gap-2 select-none w-full">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                    <div className="w-20 sm:w-24 h-7 rounded-full bg-[var(--colors-surface-elevated)] border border-dashed border-[var(--colors-hairline)] animate-skeleton shrink-0" />
                    <div className="w-24 sm:w-28 h-7 rounded-full bg-[var(--colors-surface-elevated)] border border-dashed border-[var(--colors-hairline)] animate-skeleton shrink-0" />
                    <div className="w-24 sm:w-28 h-7 rounded-full bg-[var(--colors-surface-elevated)] border border-dashed border-[var(--colors-hairline)] animate-skeleton shrink-0" />
                    <div className="w-24 sm:w-28 h-7 rounded-full bg-[var(--colors-surface-elevated)] border border-dashed border-[var(--colors-hairline)] animate-skeleton shrink-0" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                    <div className="w-16 sm:w-20 h-7 rounded-full bg-[var(--colors-surface-elevated)] border border-dashed border-[var(--colors-hairline)] animate-skeleton shrink-0" />
                    <div className="w-24 sm:w-28 h-7 rounded-full bg-[var(--colors-surface-elevated)] border border-dashed border-[var(--colors-hairline)] animate-skeleton shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Grid Section */}
        <section className="w-full border-y border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)]">
            <div
              style={{ animationDelay: '140ms' }}
              className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-dashed divide-[var(--colors-hairline)] animate-content-cascade"
            >
              {[1, 2, 3].map((cell) => (
                <div key={cell} className="p-6 sm:p-8 flex flex-col gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--colors-surface-elevated)] animate-skeleton mb-1" />
                  <div className="w-20 h-7 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
                  <div className="w-40 h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
                  <div className="w-48 h-3 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-60" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Logo Strip Section */}
        <section className="w-full bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] py-6 sm:py-7 flex flex-col items-center justify-center gap-4">
            <div
              style={{ animationDelay: '210ms' }}
              className="flex flex-col items-center gap-4 w-full animate-content-cascade"
            >
              <div className="w-36 h-3 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
              <div className="flex items-center gap-6 sm:gap-8 overflow-hidden w-full justify-center">
                {[1, 2, 3, 4, 5, 6].map((logo) => (
                  <div key={logo} className="w-20 sm:w-24 h-6 rounded bg-[var(--colors-surface-elevated)] animate-skeleton shrink-0" />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8 sm:space-y-10">
            <div
              style={{ animationDelay: '280ms' }}
              className="space-y-8 sm:space-y-10 w-full animate-content-cascade"
            >
              <div className="space-y-2">
                <div className="w-48 h-8 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
                <div className="w-64 h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-60" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
                {[1, 2, 3].map((step, idx) => (
                  <div
                    key={step}
                    className={`flex flex-col justify-between space-y-4 p-6 ${
                      idx > 0 ? 'md:border-l md:border-dashed md:border-[var(--colors-hairline)] md:pl-8' : 'md:pr-8'
                    }`}
                  >
                    <div className="w-10 h-8 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-40" />
                    <div className="w-24 h-6 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
                    <div className="w-full h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-70" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Supported Platforms Section */}
        <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8 sm:space-y-10">
            <div
              style={{ animationDelay: '350ms' }}
              className="space-y-8 sm:space-y-10 w-full animate-content-cascade"
            >
              <div className="space-y-2">
                <div className="w-56 h-8 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
                <div className="w-80 h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-60" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((card) => (
                  <div
                    key={card}
                    className="bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[var(--colors-surface-elevated)] animate-skeleton" />
                    <div className="w-24 h-5 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
                    <div className="w-full h-3 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-60" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Scroll Velocity Marquee Strip */}
        <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] py-5 sm:py-6 flex items-center justify-center">
            <div
              style={{ animationDelay: '420ms' }}
              className="w-3/4 max-w-xl h-6 rounded bg-[var(--colors-surface-elevated)] animate-skeleton animate-content-cascade"
            />
          </div>
        </section>

        {/* Technical FAQ Section */}
        <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-6">
            <div
              style={{ animationDelay: '490ms' }}
              className="space-y-6 w-full animate-content-cascade"
            >
              <div className="w-48 h-8 rounded bg-[var(--colors-surface-elevated)] animate-skeleton mb-4" />
              {[1, 2, 3, 4].map((faq) => (
                <div
                  key={faq}
                  className="bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] rounded-xl p-4 sm:p-5 flex items-center justify-between"
                >
                  <div className="w-3/5 h-5 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
                  <div className="w-5 h-5 rounded-md bg-[var(--colors-surface-elevated)] animate-skeleton" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 3. Footer (Static Gridline Borders) */}
      <footer className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] mt-auto">
        <div
          style={{ animationDelay: '560ms' }}
          className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-row items-center justify-between gap-4 w-full animate-content-cascade"
        >
          <div className="w-40 h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
          <div className="w-16 h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
        </div>
      </footer>
    </div>
  );
}

export default PageSkeleton;
