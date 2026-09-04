import React from 'react';
import type { Metadata } from 'next';
import { ActivityView, GitHubCommitData } from '@/components/activity/ActivityView';

export const metadata: Metadata = {
  title: 'Development Activity • Oxiv',
  description: 'Live development activity, calendar heatmap, and commit ledger for the Oxiv open-source media parser.',
};

// Next.js Route Segment Config: Revalidate every hour (3600 seconds) via ISR
export const revalidate = 3600;

interface ActivityPageProps {
  searchParams: Promise<{ year?: string }>;
}

async function getCommits(year?: number | null): Promise<{ commits: GitHubCommitData[]; error: string | null }> {
  try {
    let url = 'https://api.github.com/repos/xsiphr/Oxiv/commits?per_page=100';

    if (year) {
      // Filter strictly for the specified calendar year
      const since = `${year}-01-01T00:00:00Z`;
      const until = `${year}-12-31T23:59:59Z`;
      url += `&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`;
    } else {
      // Default: Last full year rolling window (365 days ago up to now)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      url += `&since=${encodeURIComponent(oneYearAgo.toISOString())}`;
    }

    const res = await fetch(url, {
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

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();

  // If year parameter is explicitly passed in URL
  const parsedYear = params?.year ? parseInt(params.year, 10) : null;
  const selectedYear = parsedYear && !isNaN(parsedYear) ? parsedYear : null;

  const { commits, error } = await getCommits(selectedYear);

  // Available years: 2026 and 2025 as demonstrated in GitHub specs
  const availableYears: number[] = [2026, 2025];
  if (currentYear > 2026 && !availableYears.includes(currentYear)) {
    availableYears.unshift(currentYear);
  }

  return (
    <ActivityView
      commits={commits}
      error={error}
      selectedYear={selectedYear}
      availableYears={availableYears}
    />
  );
}
