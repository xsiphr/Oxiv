import React from 'react';
import type { Metadata } from 'next';
import { SupportContent } from '@/components/support/SupportContent';

export const metadata: Metadata = {
  title: 'Support Oxiv Protocol • Donations & Trust Guarantees',
  description:
    'Support the open-source, watermark-free, and stateless Oxiv protocol. Donate via Buy Me a Coffee or direct cryptocurrency.',
};

export default function SupportPage() {
  return <SupportContent />;
}
