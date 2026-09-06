'use client';

import React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Oxi } from '@/components/ui/Oxi';

/**
 * OxiHeroLoader
 * 
 * Used for the homepage (/) initial loading state to keep Oxi in the exact same hero position,
 * size, and gridline container as the loaded homepage.
 * Prevents any layout jump or visual shift when the page finishes loading.
 */
export function OxiHeroLoader() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip select-none">
      {/* 1. Header Navbar */}
      <Navbar status="idle" />

      {/* 2. Main Body Content (Exact same blueprint gridlines & hero alignment) */}
      <main className="flex-1 flex flex-col w-full">
        <section className="w-full flex-1 flex flex-col">
          <div className="max-w-7xl w-full mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
            <div className="w-full flex flex-col items-center justify-center flex-1 py-10 md:py-16">
              <div className="w-full flex flex-col items-center">
                {/* Brand Mascot in exact same Hero location and clamp size */}
                <div className="flex items-center justify-center mb-6 sm:mb-8 select-none">
                  <Oxi
                    status="extracting"
                    interactive={false}
                    size="clamp(112px, 13vw, 142px)"
                    className="shrink-0"
                  />
                </div>
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

export default OxiHeroLoader;
