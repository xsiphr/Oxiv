/**
 * Performs a lightweight HEAD request to resolve exact byte sizes directly from upstream CDNs.
 */
export async function getRealContentLength(url?: string): Promise<number | undefined> {
  if (!url) return undefined;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const len = res.headers.get('content-length');
    if (len) {
      const parsed = parseInt(len, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Fall back gracefully if HEAD request is blocked
  }
  return undefined;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Direct Stream';
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${Math.round(kb)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatCount(count?: number): string {
  if (!count || count <= 0) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString();
}
