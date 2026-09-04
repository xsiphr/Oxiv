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

async function getCommits(year: number): Promise<{ commits: GitHubCommitData[]; error: string | null }> {
  try {
    const since = `${year}-01-01T00:00:00Z`;
    const until = `${year}-12-31T23:59:59Z`;
    const url = `https://api.github.com/repos/xsiphr/Oxiv/commits?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&per_page=100`;

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
  const repoStartYear = 2026;

  const parsedYear = params?.year ? parseInt(params.year, 10) : currentYear;
  const selectedYear =
    !isNaN(parsedYear) && parsedYear >= repoStartYear && parsedYear <= currentYear
      ? parsedYear
      : currentYear;

  const { commits, error } = await getCommits(selectedYear);

  // Available years: dynamically compute from currentYear down to repoStartYear (2026)
  const availableYears: number[] = [];
  for (let y = currentYear; y >= repoStartYear; y--) {
    availableYears.push(y);
  }

  // Also include any years present in commits (future-proof)
  commits.forEach((c) => {
    const d = c.commit?.author?.date || c.commit?.committer?.date;
    if (d) {
      const yr = new Date(d).getFullYear();
      if (!isNaN(yr) && !availableYears.includes(yr)) {
        availableYears.push(yr);
      }
    }
  });
  availableYears.sort((a, b) => b - a);

  return (
    <ActivityView
      commits={commits}
      error={error}
      selectedYear={selectedYear}
      availableYears={availableYears}
    />
  );
}
