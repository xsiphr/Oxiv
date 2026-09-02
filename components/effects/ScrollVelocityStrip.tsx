'use client';

import React from 'react';
import { ScrollVelocity } from './ScrollVelocity';

interface ScrollVelocityStripProps {
  texts?: string[];
  velocity?: number;
  className?: string;
}

export function ScrollVelocityStrip({
  texts = ['NO WATERMARKS · NO RETENTION · NO LIMITS ·'],
  velocity = 30,
  className = '',
}: ScrollVelocityStripProps) {
  return (
    <section
      className={`w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] transition-colors overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] py-5 sm:py-6 relative overflow-hidden select-none">
        {/* Left / Right Ambient Fade Masks */}
        <div
          className="absolute inset-y-0 left-0 w-16 sm:w-28 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to right, var(--colors-canvas) 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-16 sm:w-28 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, var(--colors-canvas) 0%, transparent 100%)',
          }}
        />

        {/* React Bits ScrollVelocity Component */}
        <ScrollVelocity
          texts={texts}
          velocity={velocity}
          numCopies={6}
          className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--colors-ink)] opacity-90 px-3"
        />
      </div>
    </section>
  );
}

export default ScrollVelocityStrip;
