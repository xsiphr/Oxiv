import React from 'react';
import type { Metadata } from 'next';
import { RecentsContent } from '@/components/recents/RecentsContent';

export const metadata: Metadata = {
  title: 'Recent Extractions • Oxiv Protocol Ledger',
  description:
    'Local browser-retained media extraction ledger. 100% private, client-side zero retention architecture.',
};

export default function RecentsPage() {
  return <RecentsContent />;
}
