export type PlatformStatus = 'live' | 'next' | 'planned' | 'unsupported';

export interface PlatformEntry {
  id: string;
  name: string;
  domains: string[];
  status: PlatformStatus;
  formats?: string;
}

/**
 * Single Source of Truth for all supported, planned, and recognized media platforms.
 */
export const PLATFORM_REGISTRY: PlatformEntry[] = [
  // ─── 1. Live Platforms (Fully operational) ───
  {
    id: 'tiktok',
    name: 'TikTok',
    domains: ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
    status: 'live',
    formats: 'MP4 (no watermark), MP3 audio, image slideshow + ZIP',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    domains: [
      'pinterest.com',
      'pin.it',
      'pinterest.co.uk',
      'pinterest.ca',
      'pinterest.de',
      'pinterest.fr',
      'pinterest.es',
      'pinterest.it',
      'pinterest.jp',
      'pinterest.at',
      'pinterest.ch',
      'pinimg.com',
    ],
    status: 'live',
    formats: 'Original master image, progressive MP4',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    domains: ['facebook.com', 'fb.watch', 'fb.com', 'm.facebook.com', 'web.facebook.com'],
    status: 'live',
    formats: 'HD/SD Progressive MP4, Isolated Soundtrack, Master Photo, Album ZIP',
  },

  // ─── 2. Next Up (In Active Pipeline Build) ───

  // ─── 3. Planned Platforms (In Active Pipeline Deployment) ───
  {
    id: 'instagram',
    name: 'Instagram',
    domains: ['instagram.com', 'instagr.am'],
    status: 'planned',
    formats: 'Reels MP4, Posts Carousel, Audio',
  },
  {
    id: 'x',
    name: 'X',
    domains: ['x.com', 'twitter.com', 't.co'],
    status: 'planned',
    formats: 'AVC1 MP4, Lossless GIF, Audio',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    domains: ['youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com'],
    status: 'planned',
    formats: 'Video MP4, Audio',
  },

  // ─── 3. Recognized but Unsupported Platforms (No immediate roadmap) ───
  {
    id: 'reddit',
    name: 'Reddit',
    domains: ['reddit.com', 'redd.it', 'v.redd.it', 'old.reddit.com'],
    status: 'unsupported',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    domains: ['snapchat.com', 'story.snapchat.com'],
    status: 'unsupported',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    domains: ['twitch.tv', 'clips.twitch.tv'],
    status: 'unsupported',
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    domains: ['vimeo.com', 'player.vimeo.com'],
    status: 'unsupported',
  },
  {
    id: 'threads',
    name: 'Threads',
    domains: ['threads.net'],
    status: 'unsupported',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    domains: ['linkedin.com'],
    status: 'unsupported',
  },
  {
    id: 'tumblr',
    name: 'Tumblr',
    domains: ['tumblr.com'],
    status: 'unsupported',
  },
];

export interface LookupResult {
  platform: PlatformEntry | null;
  isValidUrl: boolean;
  rawHostname?: string;
  status: PlatformStatus | 'invalid' | 'no-match';
}

/**
 * Normalizes input and extracts a clean hostname.
 */
export function extractHostname(input: string): string | null {
  const trimmed = input
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
    .trim()
    .replace(/^['"`\s]+|['"`\s]+$/g, '');
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.toLowerCase();
    // Validate domain structure (must contain a valid dot, no illegal surrounding dots)
    if (!host || !host.includes('.') || host.startsWith('.') || host.endsWith('.')) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

/**
 * Resolves any URL or string against the central platform registry.
 */
export function lookupPlatform(inputUrl: string): LookupResult {
  const hostname = extractHostname(inputUrl);

  if (!hostname) {
    return {
      platform: null,
      isValidUrl: false,
      status: 'invalid',
    };
  }

  for (const entry of PLATFORM_REGISTRY) {
    for (const domain of entry.domains) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return {
          platform: entry,
          isValidUrl: true,
          rawHostname: hostname,
          status: entry.status,
        };
      }
    }
  }

  return {
    platform: null,
    isValidUrl: true,
    rawHostname: hostname,
    status: 'no-match',
  };
}

/**
 * Detects platform slug or returns 'unknown'.
 */
export function detectPlatform(url: string): string {
  const { platform } = lookupPlatform(url);
  return platform ? platform.id : 'unknown';
}
