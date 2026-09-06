'use client';

import React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Oxi } from '@/components/ui/Oxi';

export interface OxiPageLoaderProps {
  /** Optional monospace label rendered beneath Oxi */
  label?: string;
}

/**
 * OxiPageLoader
 * 
 * Standard centralized loading indicator for Oxiv pages with async data-fetching delays.
 * Preserves the continuous Monochrome Gridlines framework (Navbar, side dashed hairlines, Footer)
 * with Oxi centered inside the blueprint grid with fixed gaze (no mouse tracking).
 */
export function OxiPageLoader({ label }: OxiPageLoaderProps) {
  return (
    <div
      className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip select-none"
      aria-busy="true"
      aria-label={label || 'Loading...'}
    >
      {/* 1. Sticky Navbar */}
      <Navbar />

      {/* 2. Main Body Content with Continuous Blueprint Gridlines */}
      <main className="flex-1 flex flex-col w-full">
        <section className="w-full flex-1 flex flex-col">
          <div className="max-w-7xl w-full mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="flex flex-col items-center justify-center">
              <Oxi
                status="extracting"
                interactive={false}
                size="clamp(112px, 14vw, 142px)"
                className="shrink-0"
              />

              {label && (
                <p className="font-mono text-xs text-[var(--colors-muted)] mt-5 tracking-wider uppercase animate-pulse">
                  {label}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 3. Global Seamless Connected Footer */}
      <Footer />
    </div>
  );
}

export default OxiPageLoader;
