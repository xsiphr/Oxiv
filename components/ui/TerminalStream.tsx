'use client';

import React from 'react';
import { Terminal, Check, Loader2, AlertCircle } from 'lucide-react';
import { Platform } from '@/types';
import { detectPlatform } from '@/lib/platformRegistry';

export interface StreamStepState {
  key: 'RESOLVE' | 'FETCH' | 'READY';
  title: string;
  detail: string;
  latencyMs?: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'error';
}

interface TerminalStreamProps {
  steps: StreamStepState[];
  url: string;
  platform?: Platform;
}

export function TerminalStream({ steps, url, platform: propPlatform }: TerminalStreamProps) {
  const detected = propPlatform || (detectPlatform(url) as Platform);
  const platformFlag = detected !== 'unknown' ? detected : 'media';

  return (
    <div dir="ltr" className="w-full max-w-2xl mx-auto rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] overflow-hidden shadow-xs transition-all duration-300 text-left">
      {/* 1. Top Bar */}
      <div className="px-4 py-2.5 bg-[var(--colors-surface-elevated)] border-b border-[var(--colors-hairline)] font-mono text-xs text-[var(--colors-ink)] flex items-center">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[var(--colors-muted)]" />
          <span className="font-semibold tracking-tight text-[var(--colors-ink)]">.sh</span>
        </div>
      </div>

      {/* 2. Dynamic Command Line Row */}
      <div className="px-4 py-2.5 bg-[var(--colors-canvas)] border-b border-dashed border-[var(--colors-hairline)] flex items-center gap-2">
        <span className="font-mono text-xs text-[var(--colors-muted)] select-none shrink-0">$</span>
        <span className="font-mono text-xs text-[var(--colors-body)]">
          extract <span className="text-[var(--colors-muted)]">--{platformFlag}</span>
        </span>
      </div>

      {/* 3. Authentic Steps & Log Stream */}
      <div className="p-4 space-y-2 font-mono text-xs">
        {steps.map((step) => {
          const isDone = step.status === 'completed';
          const isCurrent = step.status === 'in_progress';
          const isWaiting = step.status === 'waiting';
          const isError = step.status === 'error';

          return (
            <div
              key={step.key}
              className={`min-h-[52px] flex flex-col justify-center transition-opacity duration-200 ${isWaiting ? 'opacity-30' : 'opacity-100'
                }`}
            >
              {/* Step Header Line */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Status Glyph */}
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-[var(--colors-ink)]" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-[var(--colors-ink)] animate-spin" />
                    ) : isError ? (
                      <AlertCircle className="w-3.5 h-3.5 text-[var(--colors-ink)]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--colors-hairline-strong)]" />
                    )}
                  </div>

                  {/* Stage Tag & Title */}
                  <span
                    className={`font-semibold tracking-wide ${isDone
                        ? 'text-[var(--colors-body)]'
                        : isCurrent
                          ? 'text-[var(--colors-ink)]'
                          : isError
                            ? 'text-[var(--colors-ink)]'
                            : 'text-[var(--colors-muted)]'
                      }`}
                  >
                    [{step.key}]
                  </span>

                  <span
                    className={`truncate ${isDone
                        ? 'text-[var(--colors-body)]'
                        : isCurrent
                          ? 'text-[var(--colors-ink)]'
                          : isError
                            ? 'text-[var(--colors-ink)] font-semibold'
                            : 'text-[var(--colors-muted)]'
                      }`}
                  >
                    {step.title}
                  </span>

                  {/* Step-based blinking editor cursor */}
                  {isCurrent && (
                    <span className="inline-block w-1.5 h-3 bg-[var(--colors-ink)] animate-editor-cursor shrink-0 ml-0.5" />
                  )}
                </div>

                {/* Real Execution Latency Offset */}
                {isDone && step.latencyMs !== undefined && (
                  <span className="font-mono text-[10px] text-[var(--colors-muted)] opacity-70 shrink-0 select-none">
                    +{step.latencyMs}ms
                  </span>
                )}
              </div>

              {/* Sub-details with Left Dashed Guide Line */}
              <div className="pl-6 mt-1">
                {(isCurrent || isDone || isError) && (
                  <p className="border-l border-dashed border-[var(--colors-hairline)] pl-2.5 text-[11px] text-[var(--colors-muted)] font-mono tracking-tight">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
