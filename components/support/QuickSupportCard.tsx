'use client';

import React, { useState } from 'react';
import { Coffee, Utensils, Server, ExternalLink, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface QuickSupportCardProps {
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  className?: string;
}

type PresetId = 'coffee' | 'lunch' | 'server';

interface PresetOption {
  id: PresetId;
  amount: number;
  icon: React.ComponentType<{ className?: string }>;
}

const PRESETS: PresetOption[] = [
  { id: 'coffee', amount: 5, icon: Coffee },
  { id: 'lunch', amount: 15, icon: Utensils },
  { id: 'server', amount: 30, icon: Server },
];

export function QuickSupportCard({
  onHoverStart,
  onHoverEnd,
  className = '',
}: QuickSupportCardProps) {
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';
  const [selectedPreset, setSelectedPreset] = useState<PresetId | 'custom'>('coffee');
  const [customAmount, setCustomAmount] = useState<string>('');

  const effectiveAmount: number =
    selectedPreset === 'custom'
      ? parseFloat(customAmount) || 0
      : PRESETS.find((p) => p.id === selectedPreset)?.amount || 5;

  const isValidAmount = effectiveAmount > 0;

  const handleSelectPreset = (id: PresetId) => {
    setSelectedPreset(id);
    setCustomAmount('');
  };

  const handleCustomFocus = () => {
    setSelectedPreset('custom');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    const cleanVal = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
    setCustomAmount(cleanVal);
    setSelectedPreset('custom');
  };

  const supportUrl = isValidAmount
    ? `https://buymeacoffee.com/xsiphr?amount=${effectiveAmount}`
    : 'https://buymeacoffee.com/xsiphr';

  return (
    <div className={`w-full flex flex-col items-center text-center space-y-5 ${className}`}>
      {/* Clean & Minimal Header: Buy Me a Coffee Icon + Quick Support Title */}
      <div className="space-y-1.5 flex flex-col items-center">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--colors-ink)] flex items-center justify-center gap-2.5 tracking-tight">
          <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--colors-ink)] shrink-0" />
          <span>{t.support.quickSupportTitle}</span>
        </h2>
        <p className="font-body text-xs sm:text-sm text-[var(--colors-muted)] leading-relaxed max-w-md">
          {t.support.quickSupportSubtitle}
        </p>
      </div>

      {/* Preset Amount Grid (Direct on page, minimal elevated buttons) */}
      <div className="w-full grid grid-cols-3 gap-2.5 sm:gap-3">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPreset === p.id;
          const label = t.support.amountPresets[p.id];

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p.id)}
              onMouseEnter={onHoverStart}
              onMouseLeave={onHoverEnd}
              onFocus={onHoverStart}
              onBlur={onHoverEnd}
              className={`group flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all cursor-pointer text-center ${
                isSelected
                  ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] border-[var(--colors-ink)] shadow-xs scale-[1.02]'
                  : 'bg-[var(--colors-surface-card)] border-[var(--colors-hairline)] text-[var(--colors-ink)] hover:border-[var(--colors-hairline-strong)] hover:bg-[var(--colors-surface-elevated)]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected ? 'text-[var(--colors-canvas)]' : 'text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)]'
                  }`}
                />
                <span className="font-mono text-sm sm:text-base font-bold tracking-tight">
                  ${p.amount}
                </span>
              </div>
              <span
                className={`font-body text-[10px] sm:text-[11px] leading-tight line-clamp-1 ${
                  isSelected ? 'text-[var(--colors-canvas)]/80' : 'text-[var(--colors-muted)]'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Amount Field (Direct on page, sleek monochrome input) */}
      <div
        className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all ${
          selectedPreset === 'custom'
            ? 'border-[var(--colors-hairline-strong)] bg-[var(--colors-surface-card)]'
            : 'border-[var(--colors-hairline)] bg-[var(--colors-surface-card)]/50 hover:border-[var(--colors-hairline-strong)]'
        }`}
      >
        <span className="font-mono text-xs text-[var(--colors-muted)] select-none shrink-0">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={customAmount}
          onChange={handleCustomChange}
          onFocus={handleCustomFocus}
          placeholder={t.support.customPlaceholder}
          className="font-mono text-xs sm:text-sm bg-transparent outline-none flex-1 min-w-0 text-[var(--colors-ink)] placeholder:text-[var(--colors-muted)]"
        />
        {selectedPreset === 'custom' && customAmount && (
          <span className="font-mono text-[10px] uppercase text-[var(--colors-muted)] shrink-0 px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)]">
            {t.support.amountPresets.custom}
          </span>
        )}
      </div>

      {/* Action Button & Subtle Transparent Disclosure */}
      <div className="w-full space-y-2 pt-1">
        <a
          href={supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={onHoverStart}
          onMouseLeave={onHoverEnd}
          onFocus={onHoverStart}
          onBlur={onHoverEnd}
          className={`w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-body font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer ${
            isValidAmount
              ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 active:scale-95'
              : 'bg-[var(--colors-surface-card)] text-[var(--colors-muted)] pointer-events-none opacity-40'
          }`}
        >
          <span>
            {isValidAmount
              ? t.support.supportBtn(effectiveAmount)
              : t.support.supportBtnDefault}
          </span>
          {isRtl ? (
            <ExternalLink className="w-3.5 h-3.5 rotate-180" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          )}
        </a>

        {/* Minimal Clean Disclosure Line */}
        <p className="font-mono text-[10px] sm:text-[11px] text-[var(--colors-muted)] text-center flex items-center justify-center gap-1 select-none">
          <span>{t.support.disclosure}</span>
          <span>↗</span>
        </p>
      </div>
    </div>
  );
}

export default QuickSupportCard;
