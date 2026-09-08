import { MediaResult, MediaFormat, MediaItem, MediaAuthor } from '@/types';
import { ExtractionPipelineError } from './errors';
import { getRealContentLength, formatBytes, formatDuration, formatCount } from './utils';

// ─── Strict TypeScript Interfaces for X Syndication API ───

export interface SyndicationVideoVariant {
  bitrate?: number;
  content_type: string;
  url: string;
}

export interface SyndicationVideoInfo {
  aspect_ratio: [number, number];
  duration_millis?: number;
  variants: SyndicationVideoVariant[];
}

export interface SyndicationMediaPhoto {
  type: 'photo';
  media_url_https: string;
  original_info?: {
    width: number;
    height: number;
  };
  sizes?: {
    large?: { w: number; h: number };
    medium?: { w: number; h: number };
    small?: { w: number; h: number };
    thumb?: { w: number; h: number };
  };
  ext_alt_text?: string;
}

export interface SyndicationMediaVideo {
  type: 'video';
  media_url_https: string;
  video_info: SyndicationVideoInfo;
  original_info?: {
    width: number;
    height: number;
  };
}

export interface SyndicationMediaAnimatedGif {
  type: 'animated_gif';
  media_url_https: string;
  video_info: SyndicationVideoInfo;
  original_info?: {
    width: number;
    height: number;
  };
}

export type SyndicationMediaItem =
  | SyndicationMediaPhoto
  | SyndicationMediaVideo
  | SyndicationMediaAnimatedGif;

export interface SyndicationUser {
  id_str: string;
  name: string;
  screen_name: string;
  profile_image_url_https?: string;
  verified?: boolean;
  is_blue_verified?: boolean;
}

export interface SyndicationTweetResponse {
  __typename?: string;
  id_str?: string;
  text?: string;
  created_at?: string;
  favorite_count?: number;
  conversation_count?: number;
  user?: SyndicationUser;
  mediaDetails?: SyndicationMediaItem[];
  quoted_tweet?: SyndicationTweetResponse;
  possibly_sensitive?: boolean;
  error?: string;
}

const DESKTOP_CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Derives the deterministic syndication validation token computed by official X embed widgets.
 */
export function getSyndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, '');
}

/**
 * Resolves shortened t.co links via HTTP redirect traversal to obtain canonical URL.
 */
export async function resolveXShortlink(inputUrl: string): Promise<string> {
  try {
    const res = await fetch(inputUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': DESKTOP_CHROME_UA,
      },
    });
    return res.url || inputUrl;
  } catch {
    return inputUrl;
  }
}

/**
 * Normalizes input URL and extracts the numeric tweet status snowflake ID.
 */
export function extractTweetId(inputUrl: string): string | null {
  const sanitized = inputUrl
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
    .trim();
  if (!sanitized) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(sanitized) ? sanitized : `https://${sanitized}`;
    const parsed = new URL(withProtocol);
    const match = parsed.pathname.match(/\/status\/(\d+)/i);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // Fall back to regex scan if URL constructor fails
  }

  const fallbackMatch = sanitized.match(/(?:status\/|status%2F)(\d+)/i);
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1];
  }

  // Bare status ID string
  if (/^\d{1,30}$/.test(sanitized)) {
    return sanitized;
  }

  return null;
}

/**
 * Extracts resolution label from variant URL (e.g. vid/avc1/1080x1920/file.mp4 -> 1080x1920).
 */
function extractResolutionFromUrl(url: string): string | undefined {
  const match = url.match(/\/(\d+x\d+)\//);
  return match ? match[1] : undefined;
}

/**
 * High-precision, unauthenticated media extractor for public X (Twitter) posts.
 * Fetches SSR JSON payloads from X Syndication CDN with zero third-party dependencies.
 */
export async function extractX(inputUrl: string): Promise<MediaResult> {
  let resolvedUrl = inputUrl
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
    .trim();

  if (resolvedUrl.includes('t.co/')) {
    resolvedUrl = await resolveXShortlink(resolvedUrl);
  }

  const tweetId = extractTweetId(resolvedUrl);
  if (!tweetId) {
    throw new ExtractionPipelineError('INVALID_URL', 'Invalid X post URL or post ID.', {
      technicalDetail: `Could not parse tweet snowflake ID from input: ${inputUrl}`,
      platform: 'x',
      statusHint: 400,
    });
  }

  const token = getSyndicationToken(tweetId);
  const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en&token=${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let response: Response;
  try {
    response = await fetch(syndicationUrl, {
      headers: {
        'User-Agent': DESKTOP_CHROME_UA,
        Accept: 'application/json, text/plain, */*',
      },
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (isTimeout) {
      throw new ExtractionPipelineError('GATEWAY_TIMEOUT', 'Connection to X timed out. Please try again.', {
        technicalDetail: `Syndication request exceeded 12s timeout for tweet ${tweetId}`,
        platform: 'x',
        statusHint: 504,
      });
    }
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    throw new ExtractionPipelineError('EXTRACTION_FAILED', 'Failed to connect to X syndication server.', {
      technicalDetail: `Network fetch error: ${message}`,
      platform: 'x',
      statusHint: 500,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 404) {
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', 'This post was deleted or does not exist.', {
      technicalDetail: `Syndication endpoint returned 404 for tweet ${tweetId}`,
      platform: 'x',
      statusHint: 422,
    });
  }

  if (response.status === 429) {
    throw new ExtractionPipelineError('RATE_LIMITED', 'Upstream X extraction rate limit reached. Please wait a moment.', {
      technicalDetail: 'Syndication endpoint returned 429 Too Many Requests',
      platform: 'x',
      statusHint: 429,
    });
  }

  if (response.status === 400) {
    throw new ExtractionPipelineError('INVALID_URL', 'Invalid X post URL or post ID.', {
      technicalDetail: `Syndication endpoint returned 400 Bad Request for tweet ${tweetId}`,
      platform: 'x',
      statusHint: 400,
    });
  }

  if (!response.ok) {
    throw new ExtractionPipelineError('EXTRACTION_FAILED', `Failed to fetch X post data (${response.status}).`, {
      technicalDetail: `Syndication endpoint returned HTTP ${response.status} ${response.statusText}`,
      platform: 'x',
      statusHint: 500,
    });
  }

  let body: SyndicationTweetResponse;
  try {
    body = (await response.json()) as SyndicationTweetResponse;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'JSON parse failure';
    throw new ExtractionPipelineError('EXTRACTION_FAILED', 'Failed to parse X post payload.', {
      technicalDetail: `JSON parse exception: ${message}`,
      platform: 'x',
      statusHint: 500,
    });
  }

  if (body.__typename === 'TweetTombstone' || !body || Object.keys(body).length === 0) {
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', 'This account is private or suspended.', {
      technicalDetail: `Tweet ${tweetId} tombstoned or unavailable: ${body.__typename || 'Empty payload'}`,
      platform: 'x',
      statusHint: 422,
    });
  }

  // ─── Smart Fallback for Quoted Tweets ───
  let targetTweet = body;
  let mediaSource: 'direct' | 'quoted' = 'direct';

  const parentMedia = body.mediaDetails && body.mediaDetails.length > 0 ? body.mediaDetails : [];
  if (
    parentMedia.length === 0 &&
    body.quoted_tweet?.mediaDetails &&
    body.quoted_tweet.mediaDetails.length > 0
  ) {
    targetTweet = body.quoted_tweet;
    mediaSource = 'quoted';
  }

  const mediaDetails = targetTweet.mediaDetails || [];
  if (mediaDetails.length === 0) {
    throw new ExtractionPipelineError(
      'MEDIA_UNREACHABLE',
      'This post contains only text and has no downloadable media.',
      {
        technicalDetail: `Neither tweet ${tweetId} nor quoted tweet contained any media items.`,
        platform: 'x',
        statusHint: 422,
      }
    );
  }

  // Author Metadata
  const user = targetTweet.user || body.user;
  const authorName = user?.name || 'X User';
  const authorHandle = user?.screen_name ? `@${user.screen_name}` : '@x';
  const rawAvatar = user?.profile_image_url_https;
  // Upgrade avatar to 400x400 master resolution
  const authorAvatar = rawAvatar ? rawAvatar.replace('_normal.', '_400x400.') : undefined;

  const author: MediaAuthor = {
    name: authorName,
    handle: authorHandle,
    avatar: authorAvatar,
  };

  const rawText = body.text || targetTweet.text || '';
  const cleanTitle = rawText.replace(/https?:\/\/t\.co\/\S+/g, '').trim() || 'X Media';

  const formats: MediaFormat[] = [];
  let items: MediaItem[] | undefined;
  let isCollection = false;
  let itemCount: number | undefined;
  let duration: string | undefined;
  let dimensions: string | undefined;
  let thumbnail = '';

  const firstMedia = mediaDetails[0];

  // ─── Case 1: Video or Looping Animated GIF ───
  if (firstMedia.type === 'video' || firstMedia.type === 'animated_gif') {
    const isGif = firstMedia.type === 'animated_gif';
    thumbnail = firstMedia.media_url_https;

    if (firstMedia.original_info) {
      dimensions = `${firstMedia.original_info.width}x${firstMedia.original_info.height}`;
    }

    if (firstMedia.video_info.duration_millis) {
      const durSecs = Math.round(firstMedia.video_info.duration_millis / 1000);
      duration = formatDuration(durSecs);
    }

    // Filter progressive MP4 variants, strictly excluding HLS m3u8 playlists
    const mp4Variants = (firstMedia.video_info.variants || [])
      .filter((v) => v.content_type === 'video/mp4' && v.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    if (mp4Variants.length === 0) {
      throw new ExtractionPipelineError('EXTRACTION_FAILED', 'No progressive MP4 video streams found.', {
        technicalDetail: `No video/mp4 variants found for tweet ${targetTweet.id_str || tweetId}`,
        platform: 'x',
        statusHint: 500,
      });
    }

    // Resolve real byte sizes for all video stream variants in parallel via HEAD requests
    const variantSizes = await Promise.all(
      mp4Variants.map((v) => getRealContentLength(v.url))
    );

    for (let i = 0; i < mp4Variants.length; i++) {
      const variant = mp4Variants[i];
      const resFromUrl = extractResolutionFromUrl(variant.url) || dimensions;
      const isTop = i === 0;
      const isLast = i === mp4Variants.length - 1;

      let quality = 'SD';
      let label = isGif ? 'Looping GIF (MP4)' : 'Video (MP4)';

      if (isGif) {
        quality = 'Lossless GIF';
        label = resFromUrl ? `GIF (${resFromUrl})` : 'Animated GIF (MP4)';
      } else if (isTop) {
        quality = resFromUrl && parseInt(resFromUrl.split('x')[1] || '0', 10) >= 1080 ? 'HD 1080p' : 'HD Master';
        label = resFromUrl ? `HD Video (${resFromUrl})` : 'High Definition (MP4)';
      } else if (isLast) {
        quality = 'Mobile / SD';
        label = resFromUrl ? `SD Video (${resFromUrl})` : 'Standard Definition (MP4)';
      } else {
        quality = 'Medium';
        label = resFromUrl ? `Medium Video (${resFromUrl})` : 'Medium Quality (MP4)';
      }

      const sizeBytes = variantSizes[i] || 0;
      const variantSize = sizeBytes > 0 ? formatBytes(sizeBytes) : 'Direct Stream';

      let id: string;
      if (isGif) {
        id = `x-gif-${i + 1}`;
      } else if (isTop) {
        id = 'x-video-hd';
      } else if (isLast) {
        id = 'x-video-sd';
      } else {
        id = mp4Variants.length === 3 ? 'x-video-medium' : `x-video-medium-${i}`;
      }

      formats.push({
        id,
        type: 'video',
        label,
        quality,
        resolution: resFromUrl,
        extension: 'mp4',
        size: variantSize,
        downloadUrl: variant.url,
        isLossless: isGif || isTop,
      });
    }
  } else {
    // ─── Case 2: Photo Post (1 to 4 Images) ───
    const photoMedia = mediaDetails.filter((m): m is SyndicationMediaPhoto => m.type === 'photo');
    thumbnail = photoMedia[0]?.media_url_https || '';
    if (photoMedia[0]?.original_info) {
      dimensions = `${photoMedia[0].original_info.width}x${photoMedia[0].original_info.height}`;
    }

    if (photoMedia.length === 1) {
      const p = photoMedia[0];
      const masterUrl = `${p.media_url_https}?name=orig`;
      const sizeBytes = await getRealContentLength(masterUrl);
      const res = p.original_info ? `${p.original_info.width}x${p.original_info.height}` : dimensions;

      formats.push({
        id: 'x-photo-1',
        type: 'image',
        label: res ? `Original Master Photo (${res})` : 'Original Master Photo (JPG)',
        quality: 'Master 100%',
        resolution: res,
        extension: 'jpg',
        size: formatBytes(sizeBytes),
        downloadUrl: masterUrl,
        isLossless: true,
      });
    } else {
      // Multi-Photo Post
      isCollection = true;
      itemCount = photoMedia.length;

      items = photoMedia.map((photo, index) => {
        const masterUrl = `${photo.media_url_https}?name=orig`;
        const res = photo.original_info ? `${photo.original_info.width}x${photo.original_info.height}` : undefined;
        return {
          id: `x-photo-${index + 1}`,
          type: 'image',
          url: masterUrl,
          thumbnail: `${photo.media_url_https}?name=small`,
          resolution: res,
          extension: 'jpg',
          label: `Photo ${index + 1}`,
        };
      });

      // Archive format row for multi-photo album packaging
      formats.push({
        id: 'x-photos-zip',
        type: 'archive',
        label: `Download All Photos (${photoMedia.length}) + ZIP`,
        quality: 'Master Package',
        extension: 'zip',
        size: `${photoMedia.length} Photos`,
        downloadUrl: '#zip',
        isLossless: true,
      });

      // Add individual photo stream download rows
      for (let i = 0; i < photoMedia.length; i++) {
        const p = photoMedia[i];
        const masterUrl = `${p.media_url_https}?name=orig`;
        const res = p.original_info ? `${p.original_info.width}x${p.original_info.height}` : undefined;

        formats.push({
          id: `x-photo-${i + 1}`,
          type: 'image',
          label: res ? `Photo ${i + 1} (${res})` : `Photo ${i + 1} (JPG)`,
          quality: 'Master',
          resolution: res,
          extension: 'jpg',
          size: 'Direct Stream',
          downloadUrl: masterUrl,
          isLossless: true,
        });
      }
    }
  }

  const result: MediaResult = {
    id: targetTweet.id_str || tweetId,
    originalUrl: inputUrl,
    platform: 'x',
    title: cleanTitle,
    description: targetTweet.text || cleanTitle,
    author,
    thumbnail,
    duration,
    dimensions,
    extractedAt: new Date().toISOString(),
    formats,
    items,
    isCollection,
    itemCount,
    mediaSource,
    stats: {
      likes: formatCount(targetTweet.favorite_count ?? body.favorite_count),
      views: formatCount(targetTweet.conversation_count ?? body.conversation_count),
    },
  };

  return result;
}
