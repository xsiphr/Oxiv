import React from 'react';
import type { Metadata } from 'next';
import { ActivityView, GitHubCommitData } from '@/components/activity/ActivityView';

export const metadata: Metadata = {
  title: 'Development Activity • Oxiv',
  description: 'Live development activity, calendar heatmap, and commit ledger for the Oxiv open-source media parser.',
};

// Next.js Route Segment Config: Revalidate every hour (3600 seconds) via ISR
export const revalidate = 3600;

async function getCommits(): Promise<{ commits: GitHubCommitData[]; error: string | null }> {
  try {
    const res = await fetch('https://api.github.com/repos/xsiphr/Oxiv/commits?per_page=100', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Oxiv-App',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        commits: [],
        error: `GitHub API returned ${res.status}`,
      };
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return {
        commits: [],
        error: 'Invalid payload format',
      };
    }

    return { commits: data, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection failure';
    return { commits: [], error: msg };
  }
}

export default async function ActivityPage() {
  const { commits, error } = await getCommits();

  return <ActivityView commits={commits} error={error} />;
}
