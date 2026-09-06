'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layers, FileText, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import { scrollToElement, smoothScrollTo } from '@/lib/scroll';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function MegaMenu({ isOpen, onClose, onMouseEnter, onMouseLeave }: MegaMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const columns = [
    {
      title: t.megaMenu.philosophyTitle,
      href: '/about',
      icon: FileText,
      items: [
        { label: t.megaMenu.itemPhilosophyProtocol, href: '/about#protocol' },
        { label: t.megaMenu.itemPhilosophyArchitecture, href: '/about#architecture' },
        { label: t.megaMenu.itemPhilosophyPrivacy, href: '/about#privacy-license' },
      ],
    },
    {
      title: t.megaMenu.platformsTitle,
      href: '/about/platforms',
      icon: Layers,
      items: [
        { label: t.megaMenu.itemPlatformsSupported, href: '/about/platforms#supported-platforms' },
        { label: t.megaMenu.itemPlatformsFormats, href: '/about/platforms#link-formats' },
      ],
    },
    {
      title: t.megaMenu.faqTitle,
      href: '/about/faq',
      icon: HelpCircle,
      items: [
        { label: t.megaMenu.itemFaqPrivacy, href: '/about/faq#data-privacy' },
        { label: t.megaMenu.itemFaqHowItWorks, href: '/about/faq#how-it-works' },
      ],
    },
  ];

  const handleHeaderClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    onClose();
    const currentNorm = (pathname || '').replace(/\/$/, '');
    const targetNorm = href.replace(/\/$/, '');

    if (currentNorm === targetNorm) {
      e.preventDefault();
      smoothScrollTo(0, 750);
    }
  };

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    onClose();
    const [targetPath, targetHash] = href.split('#');
    const currentNorm = (pathname || '').replace(/\/$/, '');
    const targetNorm = targetPath.replace(/\/$/, '');

    if (currentNorm === targetNorm && targetHash) {
      // Already on the same page: smoothly glide from current position to target section
      e.preventDefault();
      const targetEl = document.getElementById(targetHash);
      if (targetEl) {
        scrollToElement(targetEl, 900, 116);
        window.history.pushState(null, '', href);
      }
    } else if (targetHash) {
      // Navigating from a different page:
      // Prevent browser from instantly jumping to anchor.
      // Store target in sessionStorage, navigate to the top of target page,
      // and let AboutLayoutClient initiate the smooth ease-in-out scroll down!
      e.preventDefault();
      try {
        sessionStorage.setItem('oxiv_scroll_target', targetHash);
      } catch {
        // Fallback to native navigation if storage is unavailable
        router.push(href);
        return;
      }
      router.push(targetPath);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="hidden md:block absolute top-full left-0 right-0 -mx-[1px] glass-header border-b border-x border-dashed border-[var(--colors-hairline)] shadow-2xl z-50 transition-colors select-none"
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* 3 Minimal Navigation Columns directly */}
          <div className="max-w-4xl mx-auto py-5 sm:py-6 px-4 sm:px-6">
            <div className="grid grid-cols-3 divide-x rtl:divide-x-reverse divide-dashed divide-[var(--colors-hairline)]">
              {columns.map((col, idx) => {
                const Icon = col.icon;
                const paddingClass =
                  idx === 0
                    ? 'pe-4 sm:pe-6'
                    : idx === 1
                    ? 'px-4 sm:px-6'
                    : 'ps-4 sm:ps-6';

                return (
                  <div key={col.title} className={`space-y-3 ${paddingClass}`}>
                    {/* Category Header */}
                    <Link
                      href={col.href}
                      onClick={(e) => handleHeaderClick(e, col.href)}
                      className="flex items-center gap-2 text-[var(--colors-ink)] hover:opacity-85 transition-opacity group"
                    >
                      <div className="w-6 h-6 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center shrink-0 text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)]">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-display font-bold text-sm tracking-tight">
                        {col.title}
                      </h3>
                    </Link>

                    {/* Clean Links List (Direct target anchors with smooth scroll) */}
                    <div className="space-y-0.5">
                      {col.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          scroll={false}
                          onClick={(e) => handleItemClick(e, item.href)}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-[var(--colors-body)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-elevated)] transition-colors group cursor-pointer"
                        >
                          <span className="leading-relaxed font-body whitespace-normal">
                            {item.label}
                          </span>
                          <ArrowIcon className="w-3 h-3 text-[var(--colors-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ms-1.5" />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MegaMenu;
