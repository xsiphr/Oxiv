import { MediaResult, MediaFormat, MediaItem, Platform } from '@/types';
import { ExtractionPipelineError } from './errors';
import {
  getRealContentLength,
  formatBytes,
  formatDuration,
  formatCount,
  sanitizeUrl,
  resolveRedirects,
} from './utils';
import { decodeHtmlEntities } from '@/lib/utils';

export type InstagramContentType = 'photo' | 'reel' | 'carousel' | 'unknown';

export const IG_DESKTOP_HEADERS: HeadersInit = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

// ─── Strict TypeScript Interfaces for Instagram Relay Payloads ───

export interface InstagramUser {
  pk?: string;
  username?: string;
  full_name?: string;
  profile_pic_url?: string;
}

export interface InstagramImageCandidate {
  url: string;
  width?: number;
  height?: number;
}

export interface InstagramImageVersions {
  candidates?: InstagramImageCandidate[];
}

export interface InstagramVideoVersion {
  type?: number;
  url: string;
  width?: number;
  height?: number;
}

export interface InstagramCarouselItem {
  pk?: string;
  id?: string;
  __typename?: string;
  media_type?: number;
  original_width?: number;
  original_height?: number;
  display_uri?: string;
  image_versions2?: InstagramImageVersions;
  video_versions?: InstagramVideoVersion[];
}

export interface InstagramMediaPost {
  pk?: string;
  id?: string;
  code?: string;
  __typename?: string;
  media_type?: number;
  product_type?: string;
  taken_at?: number;
  like_count?: number;
  comment_count?: number;
  caption?: {
    text?: string;
  };
  user?: InstagramUser;
  original_width?: number;
  original_height?: number;
  display_uri?: string;
  image_versions2?: InstagramImageVersions;
  video_versions?: InstagramVideoVersion[];
  video_duration?: number;
  has_audio?: boolean;
  carousel_media?: InstagramCarouselItem[];
  edge_sidecar_to_children?: {
    edges?: Array<{
      node?: InstagramCarouselItem;
    }>;
  };
}

export interface InstagramPolarisMedia {
  __typename?: string;
  pk?: string;
  code?: string;
  if_not_gated_logged_out?: InstagramMediaPost | null;
}

/**
 * Extracts canonical shortcode from an Instagram URL.
 * Supports /p/, /reel/, /reels/, /tv/, /share/p/, /share/r/ path patterns.
 */
export function extractInstagramShortcode(inputUrl: string): string | null {
  const sanitized = sanitizeUrl(inputUrl);
  if (!sanitized) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(sanitized) ? sanitized : `https://${sanitized}`;
    const parsed = new URL(withProtocol);
    const match = parsed.pathname.match(
      /(?:\/|^)(?:p|reel|reels|tv|share\/p|share\/r)\/([A-Za-z0-9_-]+)/i
    );
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // Fall back to direct regex matching if URL parsing fails
  }

  const directMatch = sanitized.match(
    /(?:p|reel|reels|tv|share\/p|share\/r)\/([A-Za-z0-9_-]+)/i
  );
  if (directMatch && directMatch[1]) {
    return directMatch[1];
  }

  return null;
}

/**
 * Identifies the high-level Instagram content type from a URL.
 */
export function identifyInstagramContentType(url: string): InstagramContentType {
  const lower = url.toLowerCase();
  if (lower.includes('/reel/') || lower.includes('/reels/') || lower.includes('/share/r/')) {
    return 'reel';
  }
  if (lower.includes('/p/') || lower.includes('/tv/') || lower.includes('/share/p/')) {
    return 'photo';
  }
  return 'unknown';
}

/**
 * Normalizes input URL into a canonical desktop URL with a guaranteed trailing slash.
 * Critical discovery: Instagram web frequently redirects or serves an empty client shell
 * if the path lacks a trailing slash.
 */
export async function normalizeInstagramUrl(inputUrl: string): Promise<{
  normalizedUrl: string;
  shortcode: string;
  isReel: boolean;
}> {
  let resolvedUrl = sanitizeUrl(inputUrl);
  if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
    resolvedUrl = `https://${resolvedUrl}`;
  }

  // Follow redirects for shortlinks or share links if needed
  if (resolvedUrl.includes('instagr.am') || resolvedUrl.includes('/share/')) {
    resolvedUrl = await resolveRedirects(resolvedUrl, {
      headers: IG_DESKTOP_HEADERS as Record<string, string>,
      timeoutMs: 6000,
      stopCondition: (target) =>
        target.includes('instagram.com') && !target.includes('/share/'),
    });
  }

  const shortcode = extractInstagramShortcode(resolvedUrl);
  if (!shortcode) {
    throw new ExtractionPipelineError(
      'INVALID_URL',
      'Invalid Instagram post URL. Please check the link and try again.',
      { platform: 'instagram', statusHint: 400 }
    );
  }

  const isReel =
    resolvedUrl.includes('/reel/') ||
    resolvedUrl.includes('/reels/') ||
    resolvedUrl.includes('/share/r/');

  // Guarantee trailing slash and strip tracking queries
  const pathPrefix = isReel ? 'reel' : 'p';
  const normalizedUrl = `https://www.instagram.com/${pathPrefix}/${shortcode}/`;

  return { normalizedUrl, shortcode, isReel };
}

/**
 * Recursively traverses a JSON object to find a node matching a predicate.
 */
function findNodeRecursive<T>(
  root: unknown,
  predicate: (node: Record<string, unknown>) => boolean,
  depth = 0
): T | null {
  if (!root || typeof root !== 'object' || depth > 20) return null;

  if (predicate(root as Record<string, unknown>)) {
    return root as unknown as T;
  }

  if (Array.isArray(root)) {
    for (const item of root) {
      const found = findNodeRecursive<T>(item, predicate, depth + 1);
      if (found) return found;
    }
  } else {
    for (const key of Object.keys(root)) {
      const found = findNodeRecursive<T>(
        (root as Record<string, unknown>)[key],
        predicate,
        depth + 1
      );
      if (found) return found;
    }
  }

  return null;
}

/**
 * Unauthenticated media extractor for Instagram (photos, reels/videos, and multi-item carousels).
 * Parses Meta's Relay SSR Hydration payloads with zero external scrapers, headless browsers,
 * or authenticated APIs.
 */
export async function extractInstagram(url: string): Promise<MediaResult> {
  const { normalizedUrl, shortcode } = await normalizeInstagramUrl(url);

  let html: string;
  try {
    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: IG_DESKTOP_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 429) {
      throw new ExtractionPipelineError(
        'RATE_LIMITED',
        'Instagram rate limit exceeded. Please wait a moment and try again.',
        { platform: 'instagram', statusHint: 429 }
      );
    }

    if (response.status >= 500) {
      throw new ExtractionPipelineError(
        'GATEWAY_TIMEOUT',
        'Instagram servers are currently unresponsive. Please try again shortly.',
        { platform: 'instagram', statusHint: 504 }
      );
    }

    html = await response.text();
  } catch (error) {
    if (error instanceof ExtractionPipelineError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ExtractionPipelineError(
        'GATEWAY_TIMEOUT',
        'Request to Instagram timed out. Please check your network and retry.',
        { platform: 'instagram', statusHint: 504 }
      );
    }
    throw new ExtractionPipelineError(
      'EXTRACTION_FAILED',
      'Failed to establish connection to Instagram.',
      { platform: 'instagram', technicalDetail: error instanceof Error ? error.message : String(error) }
    );
  }

  // ─── Step 1: Scan SSR Script Tags for Relay PrefetchedStreamCache ───
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
  const scriptMatches = [...html.matchAll(scriptRegex)];

  let mediaPost: InstagramMediaPost | null = null;

  for (const match of scriptMatches) {
    const content = match[1];
    if (
      !content.includes('xig_polaris_media') &&
      !content.includes('xdt_shortcode_media') &&
      !content.includes('shortcode_media')
    ) {
      continue;
    }

    try {
      const parsed = JSON.parse(content);

      // Search for xig_polaris_media envelope
      const polarisEnvelope = findNodeRecursive<{
        xig_polaris_media?: InstagramPolarisMedia;
        xdt_shortcode_media?: InstagramMediaPost;
        shortcode_media?: InstagramMediaPost;
      }>(
        parsed,
        (node) =>
          Boolean(node.xig_polaris_media) ||
          Boolean(node.xdt_shortcode_media) ||
          Boolean(node.shortcode_media)
      );

      if (polarisEnvelope?.xig_polaris_media) {
        const polaris = polarisEnvelope.xig_polaris_media;
        if (polaris.if_not_gated_logged_out) {
          mediaPost = polaris.if_not_gated_logged_out;
          break;
        }
      } else if (polarisEnvelope?.xdt_shortcode_media) {
        mediaPost = polarisEnvelope.xdt_shortcode_media;
        break;
      } else if (polarisEnvelope?.shortcode_media) {
        mediaPost = polarisEnvelope.shortcode_media;
        break;
      }
    } catch {
      // Continue scanning subsequent scripts
    }
  }

  // If no media post found, post is private, deleted, or login-walled
  if (!mediaPost) {
    throw new ExtractionPipelineError(
      'MEDIA_UNREACHABLE',
      'This Instagram post is private, deleted, or unavailable.',
      { platform: 'instagram', statusHint: 404 }
    );
  }

  // ─── Step 2: Extract Author, Metadata & Stats ───
  const user = mediaPost.user || {};
  const authorName = decodeHtmlEntities(user.full_name || user.username || 'Instagram Creator');
  const authorHandle = user.username ? `@${user.username}` : '@instagram';
  const authorAvatar = user.profile_pic_url || '';

  const captionText = decodeHtmlEntities(mediaPost.caption?.text || '');
  const title = captionText
    ? captionText.slice(0, 100) + (captionText.length > 100 ? '…' : '')
    : `${authorName} on Instagram`;

  const stats = {
    likes: mediaPost.like_count !== undefined ? formatCount(mediaPost.like_count) : undefined,
    shares: undefined,
  };

  const id = `instagram-${shortcode}`;
  const extractedAt = new Date().toISOString();

  // ─── Step 3: Parse Formats and Items ───
  const carouselItems =
    mediaPost.carousel_media ||
    mediaPost.edge_sidecar_to_children?.edges?.map((e) => e.node).filter(Boolean) ||
    [];

  // ─── Case A: Multi-Item Carousel ───
  if (carouselItems.length > 1) {
    const items: MediaItem[] = [];
    const formats: MediaFormat[] = [];

    for (let idx = 0; idx < carouselItems.length; idx++) {
      const item = carouselItems[idx] as InstagramCarouselItem;
      const isVideo = Boolean(item.video_versions && item.video_versions.length > 0);
      const itemId = `instagram-slide-${idx + 1}`;

      let mediaUrl = '';
      let thumbUrl = '';
      let resLabel: string | undefined;

      if (isVideo && item.video_versions && item.video_versions.length > 0) {
        // Sort video variants by resolution descending
        const sortedVideos = [...item.video_versions].sort((a, b) => {
          const resA = (a.width || 0) * (a.height || 0);
          const resB = (b.width || 0) * (b.height || 0);
          return resB - resA;
        });
        const topVideo = sortedVideos[0];
        mediaUrl = topVideo.url;
        if (topVideo.width && topVideo.height) {
          resLabel = `${topVideo.width}x${topVideo.height}`;
        }
        // Fallback thumbnail from candidate images
        thumbUrl =
          item.image_versions2?.candidates?.[0]?.url || item.display_uri || '';
      } else {
        // Image item
        const candidates = item.image_versions2?.candidates || [];
        const topImage = candidates[0];
        mediaUrl = topImage?.url || item.display_uri || '';
        thumbUrl =
          candidates[candidates.length - 1]?.url || item.display_uri || mediaUrl;
        if (item.original_width && item.original_height) {
          resLabel = `${item.original_width}x${item.original_height}`;
        } else if (topImage?.width && topImage?.height) {
          resLabel = `${topImage.width}x${topImage.height}`;
        }
      }

      items.push({
        id: itemId,
        type: isVideo ? 'video' : 'image',
        url: mediaUrl,
        thumbnail: thumbUrl || mediaUrl,
        resolution: resLabel,
        extension: isVideo ? 'mp4' : 'jpg',
        label: isVideo ? `Video ${idx + 1}` : `Photo ${idx + 1}`,
      });
    }

    // Add Archive (ZIP) format row for full carousel bundling
    formats.push({
      id: 'instagram-carousel-zip',
      type: 'archive',
      label: `Download Full Carousel (${items.length} Items) + ZIP`,
      quality: 'Master Package',
      extension: 'zip',
      size: `${items.length} Items`,
      downloadUrl: '#zip',
      isLossless: true,
    });

    // Add individual stream download format rows
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      formats.push({
        id: `instagram-item-${i + 1}`,
        type: it.type === 'video' ? 'video' : 'image',
        label: it.type === 'video' ? `Video #${i + 1} (MP4)` : `Photo #${i + 1} (JPG)`,
        quality: 'Original Master',
        resolution: it.resolution,
        extension: it.extension,
        size: 'Direct Stream',
        downloadUrl: it.url,
        isLossless: true,
      });
    }

    const primaryThumbnail = items[0]?.thumbnail || items[0]?.url || '';

    return {
      id,
      originalUrl: normalizedUrl,
      platform: 'instagram' as Platform,
      title,
      description: captionText || undefined,
      author: {
        name: authorName,
        handle: authorHandle,
        avatar: authorAvatar || undefined,
      },
      thumbnail: primaryThumbnail,
      dimensions: items[0]?.resolution,
      extractedAt,
      formats,
      items,
      isCollection: true,
      itemCount: items.length,
      stats,
    };
  }

  // ─── Case B: Single Video / Reel ───
  if (mediaPost.video_versions && mediaPost.video_versions.length > 0) {
    const sortedVideos = [...mediaPost.video_versions].sort((a, b) => {
      const resA = (a.width || 0) * (a.height || 0);
      const resB = (b.width || 0) * (b.height || 0);
      return resB - resA;
    });

    const topVideo = sortedVideos[0];
    const topSizeBytes = await getRealContentLength(topVideo.url);
    const topRes =
      mediaPost.original_width && mediaPost.original_height
        ? `${mediaPost.original_width}x${mediaPost.original_height}`
        : topVideo.width && topVideo.height
        ? `${topVideo.width}x${topVideo.height}`
        : undefined;

    const formats: MediaFormat[] = [
      {
        id: 'instagram-video-hd',
        type: 'video',
        label: topRes ? `HD Reel Video (${topRes})` : 'HD Reel Video (MP4)',
        quality: 'HD Master',
        resolution: topRes,
        extension: 'mp4',
        size: formatBytes(topSizeBytes),
        downloadUrl: topVideo.url,
        isLossless: true,
      },
    ];

    // Optional SD fallback if multiple distinct renditions exist
    if (sortedVideos.length > 1) {
      const sdVideo = sortedVideos[sortedVideos.length - 1];
      if (sdVideo.url !== topVideo.url) {
        const sdSizeBytes = await getRealContentLength(sdVideo.url);
        const sdRes =
          sdVideo.width && sdVideo.height ? `${sdVideo.width}x${sdVideo.height}` : undefined;
        formats.push({
          id: 'instagram-video-sd',
          type: 'video',
          label: sdRes ? `SD Reel Video (${sdRes})` : 'SD Reel Video (MP4)',
          quality: 'Mobile / SD',
          resolution: sdRes,
          extension: 'mp4',
          size: formatBytes(sdSizeBytes),
          downloadUrl: sdVideo.url,
        });
      }
    }

    const duration =
      mediaPost.video_duration !== undefined
        ? formatDuration(mediaPost.video_duration)
        : undefined;

    const primaryThumbnail =
      mediaPost.image_versions2?.candidates?.[0]?.url || mediaPost.display_uri || '';

    return {
      id,
      originalUrl: normalizedUrl,
      platform: 'instagram' as Platform,
      title,
      description: captionText || undefined,
      author: {
        name: authorName,
        handle: authorHandle,
        avatar: authorAvatar || undefined,
      },
      thumbnail: primaryThumbnail,
      duration,
      dimensions: topRes,
      extractedAt,
      formats,
      isCollection: false,
      stats,
    };
  }

  // ─── Case C: Single Photo Post ───
  const candidates = mediaPost.image_versions2?.candidates || [];
  const masterPhotoUrl = candidates[0]?.url || mediaPost.display_uri || '';
  if (!masterPhotoUrl) {
    throw new ExtractionPipelineError(
      'EXTRACTION_FAILED',
      'Failed to resolve master photo stream from Instagram payload.',
      { platform: 'instagram' }
    );
  }

  const masterSizeBytes = await getRealContentLength(masterPhotoUrl);
  const photoRes =
    mediaPost.original_width && mediaPost.original_height
      ? `${mediaPost.original_width}x${mediaPost.original_height}`
      : candidates[0]?.width && candidates[0]?.height
      ? `${candidates[0].width}x${candidates[0].height}`
      : undefined;

  const formats: MediaFormat[] = [
    {
      id: 'instagram-photo-master',
      type: 'image',
      label: photoRes
        ? `Original Master Photo (${photoRes})`
        : 'Original Master Photo (JPG)',
      quality: 'Master 100%',
      resolution: photoRes,
      extension: 'jpg',
      size: formatBytes(masterSizeBytes),
      downloadUrl: masterPhotoUrl,
      isLossless: true,
    },
  ];

  return {
    id,
    originalUrl: normalizedUrl,
    platform: 'instagram' as Platform,
    title,
    description: captionText || undefined,
    author: {
      name: authorName,
      handle: authorHandle,
      avatar: authorAvatar || undefined,
    },
    thumbnail: masterPhotoUrl,
    dimensions: photoRes,
    extractedAt,
    formats,
    isCollection: false,
    stats,
  };
}
