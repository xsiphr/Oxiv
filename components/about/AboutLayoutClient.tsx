'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Layers, HelpCircle } from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { useI18n } from '@/lib/i18n';
import { scrollToElement } from '@/lib/scroll';

interface AboutLayoutClientProps {
  children: React.ReactNode;
}

export function AboutLayoutClient({ children }: AboutLayoutClientProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  // Handle smooth scroll when navigating to an anchor target:
  // Starts at the top of the page (y = 0), then glides smoothly down with easeInOutCubic!
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Check if there is a pending scroll target from cross-page navigation
    let targetId = '';
    try {
      targetId = sessionStorage.getItem('oxiv_scroll_target') || '';
      if (targetId) {
        sessionStorage.removeItem('oxiv_scroll_target');
      }
    } catch {
      // ignore
    }

    if (!targetId && window.location.hash) {
      targetId = window.location.hash.replace('#', '');
    }

    if (targetId) {
      // 1. Force the page to start at the top
      window.scrollTo(0, 0);

      // 2. Pause briefly so the user sees the page top, then smoothly glide down to the target section
      const timer = setTimeout(() => {
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          scrollToElement(targetEl, 1000, 116);
          window.history.replaceState(null, '', `${window.location.pathname}#${targetId}`);
        }
      }, 220);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const isPhilosophyActive = pathname === '/about' || pathname === '/about/';
  const isPlatformsActive = pathname.startsWith('/about/platforms');
  const isFaqActive = pathname.startsWith('/about/faq');

  const navItems = [
    {
      label: t.about.navPhilosophy,
      href: '/about',
      isActive: isPhilosophyActive,
      icon: FileText,
    },
    {
      label: t.about.navPlatforms,
      href: '/about/platforms',
      isActive: isPlatformsActive,
      icon: Layers,
    },
    {
      label: t.about.navFaq,
      href: '/about/faq',
      isActive: isFaqActive,
      icon: HelpCircle,
    },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--colors-canvas)] transition-colors overflow-x-clip">
      {/* 1. Primary Sticky Header Navbar */}
      <Navbar />

      {/* 2. Secondary Sticky Navigation Bar (Persists across all /about/* routes) */}
      <nav
        aria-label="About section navigation"
        className="sticky top-16 sm:top-18 z-30 w-full glass-header border-b border-dashed border-[var(--colors-hairline)] transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-start gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono text-xs transition-all shrink-0 select-none ${
                  item.isActive
                    ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] font-bold shadow-xs scale-[1.02]'
                    : 'bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-body)] hover:text-[var(--colors-ink)] hover:border-[var(--colors-hairline-strong)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 3. Main Route Content */}
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>

      {/* 4. Global Footer */}
      <Footer />
    </div>
  );
}

export default AboutLayoutClient;
