'use client';

import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Platform } from '@/types';

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

export function TerminalStream({ steps }: TerminalStreamProps) {
  return (
    <div dir="ltr" className="w-full max-w-xl mx-auto py-4 transition-all duration-300 text-left">
      <div className="space-y-3 font-mono text-xs">
        {steps.map((step) => {
          const isDone = step.status === 'completed';
          const isCurrent = step.status === 'in_progress';
          const isWaiting = step.status === 'waiting';
          const isError = step.status === 'error';

          return (
            <div
              key={step.key}
              className={`flex flex-col justify-center transition-opacity duration-200 ${
                isWaiting ? 'opacity-25' : 'opacity-100'
              }`}
            >
              {/* Step Header Line */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Status Glyph */}
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-[var(--colors-ink)]" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-[var(--colors-ink)] animate-spin" />
                    ) : isError ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--colors-hairline-strong)]" />
                    )}
                  </div>

                  {/* Stage Tag & Title */}
                  <span
                    className={`font-semibold tracking-wide ${
                      isDone
                        ? 'text-[var(--colors-body)]'
                        : isCurrent
                        ? 'text-[var(--colors-ink)]'
                        : isError
                        ? 'text-rose-500'
                        : 'text-[var(--colors-muted)]'
                    }`}
                  >
                    [{step.key}]
                  </span>

                  <span
                    className={`truncate ${
                      isDone
                        ? 'text-[var(--colors-body)]'
                        : isCurrent
                        ? 'text-[var(--colors-ink)] font-medium'
                        : isError
                        ? 'text-rose-500 font-medium'
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
                  <span className="font-mono text-[11px] text-[var(--colors-muted)] shrink-0 select-none">
                    +{step.latencyMs}ms
                  </span>
                )}
              </div>

              {/* Sub-details with Left Dashed Guide Line */}
              {(isCurrent || isDone || isError) && step.detail && (
                <div className="pl-6 mt-1">
                  <p className="border-l border-dashed border-[var(--colors-hairline)] pl-2.5 text-[11px] text-[var(--colors-muted)] font-mono tracking-tight">
                    {step.detail}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
