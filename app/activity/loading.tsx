'use client';

import React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';

export default function ActivityLoading() {
  return (
    <div
      className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip select-none"
      aria-busy="true"
      aria-label="Loading activity page..."
    >
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Main Content Skeleton */}
      <main className="flex-1 flex flex-col w-full">
        {/* Top Header Navigation Bar */}
        <div className="w-full border-b border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
            {/* Back to Home Skeleton */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
              <div className="w-24 h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton" />
            </div>

            {/* GitHub Link Skeleton */}
            <div className="w-32 h-8 rounded-lg bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] animate-skeleton" />
          </div>
        </div>

        {/* Hero Header Skeleton */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-3 sm:space-y-4">
            <div className="w-72 sm:w-96 h-9 sm:h-12 rounded-lg bg-[var(--colors-surface-elevated)] animate-skeleton" />
            <div className="w-full max-w-xl h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-60" />
          </div>
        </section>

        {/* Contribution Heatmap Section Skeleton */}
        <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-4">
            {/* Header: Title on Left + Mobile Dropdown on Right */}
            <div className="flex items-center justify-between gap-3">
              <div className="w-60 sm:w-72 h-7 rounded-md bg-[var(--colors-surface-elevated)] animate-skeleton" />
              <div className="md:hidden w-28 h-8 rounded-lg bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] animate-skeleton" />
            </div>

            {/* Split Layout: Heatmap Card + Year Selector Column */}
            <div className="flex flex-col md:flex-row gap-5 lg:gap-6 items-start">
              {/* Left (Main Heatmap Card) */}
              <div className="flex-1 min-w-0 w-full bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
                {/* SVG/Grid Mock Shimmer */}
                <div className="overflow-x-auto pb-1 scrollbar-thin">
                  <div className="w-full min-w-[720px] h-[145px] rounded-lg bg-[var(--colors-surface-elevated)]/40 animate-skeleton flex flex-col justify-between p-3">
                    {/* Mock Month Labels */}
                    <div className="flex items-center justify-between px-8">
                      {['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(
                        (_, i) => (
                          <div key={i} className="w-6 h-3 rounded bg-[var(--colors-surface-elevated)] opacity-40" />
                        )
                      )}
                    </div>
                    {/* Mock Grid Dots */}
                    <div className="grid grid-flow-col grid-rows-7 gap-[3.5px] pl-8">
                      {Array.from({ length: 53 * 7 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-[14px] h-[14px] rounded-[2.5px] bg-[var(--colors-surface-elevated)]/60"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer of Heatmap Card */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs font-mono select-none border-t border-dashed border-[var(--colors-hairline)]">
                  <div className="w-44 h-3 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-60" />
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-3 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-50" />
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-[2px] bg-[var(--colors-surface-elevated)] animate-skeleton"
                        />
                      ))}
                    </div>
                    <div className="w-10 h-3 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-50" />
                  </div>
                </div>
              </div>

              {/* Right Column (Desktop Year Selector Stack) */}
              <div className="hidden md:flex md:flex-col gap-1.5 w-28 lg:w-32 shrink-0">
                <div className="w-full h-9 rounded-lg bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline-strong)] animate-skeleton" />
              </div>
            </div>
          </div>
        </section>

        {/* Commit History Ledger Section Skeleton */}
        <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)]">
          <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
            <div className="space-y-1.5">
              <div className="w-48 sm:w-60 h-7 rounded-md bg-[var(--colors-surface-elevated)] animate-skeleton" />
              <div className="w-72 sm:w-80 h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-60" />
            </div>

            {/* 5 Commit Rows Skeleton */}
            <div className="rounded-xl border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] shadow-xs divide-y divide-dashed divide-[var(--colors-hairline)] overflow-hidden">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[var(--colors-surface-elevated)] animate-skeleton shrink-0" />
                      <div
                        style={{ width: `${60 + (i % 3) * 15}%` }}
                        className="max-w-md h-4 rounded bg-[var(--colors-surface-elevated)] animate-skeleton"
                      />
                    </div>
                    <div className="w-44 h-3 rounded bg-[var(--colors-surface-elevated)] animate-skeleton opacity-50 ml-6" />
                  </div>
                  <div className="w-20 h-6 rounded-md bg-[var(--colors-surface-elevated)] animate-skeleton shrink-0 self-end sm:self-auto" />
                </div>
              ))}

              {/* Show more button skeleton */}
              <div className="p-3 bg-[var(--colors-surface-card)] flex justify-center border-t border-dashed border-[var(--colors-hairline)]">
                <div className="w-36 h-8 rounded-lg bg-[var(--colors-surface-elevated)] animate-skeleton" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}
