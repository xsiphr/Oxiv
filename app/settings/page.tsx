import React from 'react';
import type { Metadata } from 'next';
import { SettingsContent } from '@/components/settings/SettingsContent';

export const metadata: Metadata = {
  title: 'Settings & Client Preferences • Oxiv Protocol',
  description:
    'Customize theme, language, and client storage preferences for the stateless Oxiv media extraction engine.',
};

export default function SettingsPage() {
  return <SettingsContent />;
}
