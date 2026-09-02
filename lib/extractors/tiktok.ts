import { MediaResult, MediaFormat } from '@/types';
import { ExtractionPipelineError } from './errors';

interface TikWMResponse {
  code: number;
  msg: string;
  processed_time?: number;
  data?: {
    id: string;
    region?: string;
    title?: string;
    cover?: string;
    origin_cover?: string;
    dynamic_cover?: string;
    duration?: number;
    play?: string;
    wmplay?: string;
    hdplay?: string;
    size?: number;
    wm_size?: number;
    hd_size?: number;
    images?: string[];
    music?: string;
    music_info?: {
      id?: string;
      title?: string;
      play?: string;
      author?: string;
      duration?: number;
    };
    play_count?: number;
    digg_count?: number;
    comment_count?: number;
    share_count?: number;
    download_count?: number;
    author?: {
      id?: string;
      unique_id?: string;
      nickname?: string;
      avatar?: string;
    };
  };
}

/**
 * Resolves shortened TikTok URLs (e.g. vt.tiktok.com, vm.tiktok.com) to canonical URLs.
 */
export async function resolveTikTokUrl(inputUrl: string): Promise<string> {
  try {
    const res = await fetch(inputUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    return res.url || inputUrl;
  } catch {
    return inputUrl;
  }
}

import { getRealContentLength, formatBytes, formatDuration, formatCount } from './utils';

/**
 * Primary Provider: Extract TikTok media via TikWM API.
 * Authentically returns only genuine distinct streams:
 * 1. Single Original No-Watermark Master Video (with exact byte size) OR Multiple Photo Slideshow (.zip)
 * 2. Isolated Audio Soundtrack (with exact byte size via Content-Length)
 */
async function fetchFromTikWM(canonicalUrl: string): Promise<MediaResult | null> {
  const formData = new URLSearchParams();
  formData.append('url', canonicalUrl);
  formData.append('hd', '1');

  let res: Response;
  try {
    res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/javascript, */*; q=0.01',
      },
      body: formData.toString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network failure';
    throw new ExtractionPipelineError('GATEWAY_TIMEOUT', 'Failed to establish connection to upstream TikTok gateway.', {
      technicalDetail: `Connection error: ${errorMsg}`,
      platform: 'tiktok',
      statusHint: 504,
    });
  }

  if (res.status === 429) {
    throw new ExtractionPipelineError('RATE_LIMITED', 'Upstream TikTok extraction gateway is rate-limited. Please wait a moment before retrying.', {
      platform: 'tiktok',
      statusHint: 429,
    });
  }

  if (!res.ok) {
    throw new ExtractionPipelineError('GATEWAY_TIMEOUT', `Upstream gateway returned HTTP status ${res.status}.`, {
      technicalDetail: `HTTP ${res.status} ${res.statusText}`,
      platform: 'tiktok',
      statusHint: 504,
    });
  }

  const json: TikWMResponse = await res.json();
  if (json.code !== 0 || !json.data) {
    const upstreamMsg = json.msg || 'Target video is unavailable.';
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', 'TikTok post is private, deleted, or geographically restricted.', {
      technicalDetail: `TikWM code: ${json.code}, message: "${upstreamMsg}"`,
      platform: 'tiktok',
      statusHint: 422,
    });
  }

  const d = json.data;
  const isSlideshow = Array.isArray(d.images) && d.images.length > 0;
  const rawImages = d.images || [];
  const videoUrl = d.hdplay || d.play || '';
  const audioUrl = d.music || d.music_info?.play || '';
  const coverUrl = d.dynamic_cover || d.origin_cover || d.cover || (rawImages[0] ?? '');
  const realVideoSize = d.hd_size || d.size;

  const formats: MediaFormat[] = [];
  const items = isSlideshow
    ? await Promise.all(
        rawImages.map(async (imgUrl, idx) => {
          const fullImg = imgUrl.startsWith('http') ? imgUrl : `https://www.tikwm.com${imgUrl}`;
          const realImageBytes = await getRealContentLength(fullImg);
          return {
            id: `tt-img-${d.id}-${idx + 1}`,
            type: 'image' as const,
            url: fullImg,
            thumbnail: fullImg,
            extension: 'JPG',
            size: formatBytes(realImageBytes),
            label: `Photo ${idx + 1}`,
          };
        })
      )
    : undefined;

  // Case A: Photo Slideshow
  if (isSlideshow && items && items.length > 0) {
    if (items.length >= 2) {
      // 1. Lossless ZIP Bundle Package
      formats.push({
        id: `tt-zip-${d.id}`,
        type: 'archive',
        label: `All Photos (${items.length} Images)`,
        quality: 'Lossless ZIP Package',
        extension: 'ZIP',
        size: `${items.length} Files`,
        downloadUrl: '#zip',
        isLossless: true,
      });

      // Individual Image Streams
      for (const item of items) {
        formats.push({
          id: item.id,
          type: 'image',
          label: item.label || 'Original Photo',
          quality: 'Original Master',
          extension: 'JPG',
          size: item.size || 'Direct Stream',
          downloadUrl: item.url,
          isLossless: true,
        });
      }
    } else {
      // Single photo post
      formats.push({
        id: items[0].id,
        type: 'image',
        label: 'Original Photo',
        quality: 'Original Master',
        extension: 'JPG',
        size: items[0].size || 'Direct Stream',
        downloadUrl: items[0].url,
        isLossless: true,
      });
    }
  } else if (videoUrl) {
    // Case B: Single Master Video (Original Source, No Watermark)
    const fullVideoUrl = videoUrl.startsWith('http') ? videoUrl : `https://www.tikwm.com${videoUrl}`;
    formats.push({
      id: `tt-video-${d.id}`,
      type: 'video',
      label: 'Original Video (No Watermark)',
      quality: 'Original Master',
      extension: 'MP4',
      size: formatBytes(realVideoSize),
      downloadUrl: fullVideoUrl,
      isLossless: true,
    });
  }

  // Common: Isolated Soundtrack MP3 with real Content-Length query
  if (audioUrl) {
    const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `https://www.tikwm.com${audioUrl}`;
    const realAudioBytes = await getRealContentLength(fullAudioUrl);

    formats.push({
      id: `tt-audio-${d.id}`,
      type: 'audio',
      label: 'Isolated Soundtrack',
      quality: 'Studio Audio',
      extension: 'MP3',
      size: formatBytes(realAudioBytes),
      downloadUrl: fullAudioUrl,
      isLossless: true,
    });
  }

  const primaryThumbnail = (items && items[0]?.url) || (coverUrl.startsWith('http') ? coverUrl : `https://www.tikwm.com${coverUrl}`);

  return {
    id: `tt-${d.id}`,
    originalUrl: canonicalUrl,
    platform: 'tiktok',
    title: d.title || (isSlideshow ? `TikTok Photo Slideshow (${d.id})` : `TikTok Video (${d.id})`),
    description: d.title || undefined,
    author: {
      name: d.author?.nickname || d.author?.unique_id || 'TikTok Creator',
      handle: d.author?.unique_id ? `@${d.author.unique_id}` : '@tiktok.creator',
      avatar: d.author?.avatar,
    },
    thumbnail: primaryThumbnail,
    duration: isSlideshow ? undefined : formatDuration(d.duration),
    isCollection: isSlideshow && (items?.length ?? 0) >= 2,
    itemCount: items?.length,
    items,
    extractedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    formats,
    stats: {
      views: formatCount(d.play_count),
      likes: formatCount(d.digg_count),
      shares: formatCount(d.share_count),
    },
  };
}

/**
 * Main TikTok Extractor function.
 * Resolves short links, queries the extraction pipeline, and strictly throws if resolution fails.
 */
export async function extractTikTok(url: string): Promise<MediaResult> {
  const canonicalUrl = await resolveTikTokUrl(url.trim());

  // Attempt Tier 1: TikWM API Provider
  const result = await fetchFromTikWM(canonicalUrl);
  if (result && result.formats.length > 0) {
    return result;
  }

  throw new ExtractionPipelineError('MEDIA_UNREACHABLE', 'Unable to extract TikTok video. Please verify that the post is public and the link is valid.', {
    platform: 'tiktok',
    statusHint: 422,
  });
}
