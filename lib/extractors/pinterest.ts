import { MediaResult, MediaFormat, MediaItem } from '@/types';
import { ExtractionPipelineError } from './errors';
import { decodeHtmlEntities } from '@/lib/utils';
import { getRealContentLength, formatBytes, formatDuration } from './utils';

interface PinterestRendition {
  url?: string;
  width?: number;
  height?: number;
  duration?: number; // milliseconds
  thumbnail?: string;
}

interface PinterestBlock {
  block_type?: number;
  type?: string;
  image?: {
    images?: Record<string, PinterestRendition>;
  };
  video?: {
    video_list?: Record<string, PinterestRendition>;
  };
}

interface PinterestStoryPage {
  blocks?: PinterestBlock[];
  video?: {
    video_list?: Record<string, PinterestRendition>;
  };
  image?: {
    images?: Record<string, PinterestRendition>;
  };
}

interface PinterestPinData {
  id?: string;
  grid_title?: string;
  title?: string;
  description?: string;
  is_video?: boolean;
  is_animated?: boolean;
  pinner?: {
    username?: string;
    full_name?: string;
    image_small_url?: string;
    profile_url?: string;
  };
  board?: {
    name?: string;
  };
  rich_metadata?: {
    title?: string;
    description?: string;
  } | null;
  images?: Record<string, PinterestRendition>;
  videos?: {
    video_list?: Record<string, PinterestRendition>;
  };
  story_pin_data?: {
    page_count?: number;
    pages?: PinterestStoryPage[];
    metadata?: {
      root?: {
        title?: string;
      };
    };
  };
  carousel_data?: {
    carousel_slots?: Array<{
      images?: Record<string, PinterestRendition>;
      videos?: { video_list?: Record<string, PinterestRendition> };
    }>;
  };
  error?: string;
}

interface PinterestWidgetResponse {
  status?: string;
  code?: number;
  message?: string;
  data?: PinterestPinData[] | { pins?: PinterestPinData[] };
}

/**
 * Resolves shortened Pinterest URLs (e.g. pin.it/...) to canonical URLs.
 */
export async function resolvePinterestUrl(inputUrl: string): Promise<string> {
  try {
    if (/\/pin\/\d+/.test(inputUrl)) return inputUrl;

    let currentUrl = inputUrl.trim();
    if (!currentUrl.startsWith('http')) currentUrl = `https://${currentUrl}`;

    for (let hop = 0; hop < 4; hop++) {
      if (/\/pin\/\d+/.test(currentUrl)) return currentUrl;

      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(6000),
      });

      const location = res.headers.get('location');
      if (!location) break;

      let nextTarget = location;
      if (nextTarget.startsWith('/')) {
        const origin = new URL(currentUrl).origin;
        nextTarget = `${origin}${nextTarget}`;
      }

      if (/\/pin\/\d+/.test(nextTarget)) return nextTarget;

      // If redirected to pinterest homepage or generic landing, the short link is invalid or expired
      if (/^https?:\/\/(www\.)?pinterest\.[a-z.]+\/?$/i.test(nextTarget)) {
        return nextTarget;
      }

      currentUrl = nextTarget;
    }

    return currentUrl;
  } catch {
    return inputUrl;
  }
}

/**
 * Extracts numeric Pin ID from a canonical or web Pinterest URL.
 */
export function extractPinterestId(url: string): string | null {
  try {
    const match = url.match(/\/pin\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Extracts username and board slug from a canonical Pinterest board URL.
 */
export function extractPinterestBoardInfo(url: string): { user: string; board: string } | null {
  try {
    const cleanUrl = url.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const pathOnly = cleanUrl.split('?')[0].split('#')[0];
    const parts = pathOnly.split('/').filter(Boolean);

    // Format: pinterest.com/{user}/{board} or pinterest.co.uk/{user}/{board} (ignoring api.pinterest.com)
    if (parts.length >= 3 && parts[0].includes('pinterest.') && !parts[0].startsWith('api.')) {
      const user = parts[1];
      const board = parts[2];
      const reserved = [
        'pin',
        'search',
        'ideas',
        'today',
        'settings',
        'business',
        'newsroom',
        'about',
        '_',
        'resource',
        'shop',
        'watch',
        'login',
        'signup',
        'url_shortener',
        'api',
      ];
      if (!reserved.includes(user.toLowerCase()) && !reserved.includes(board.toLowerCase())) {
        return { user, board };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Filters out HLS/DASH manifest streams (.m3u8, .mpd) and returns the tallest progressive file URL.
 */
function selectTallestMediaFile(
  renditionMap?: Record<string, PinterestRendition>
): (PinterestRendition & { url: string }) | null {
  if (!renditionMap) return null;

  const validFiles = Object.values(renditionMap).filter(
    (item): item is PinterestRendition & { url: string } =>
      typeof item?.url === 'string' && !/\.(m3u8|mpd)(\?|$)/i.test(item.url)
  );

  if (validFiles.length === 0) return null;

  return validFiles.reduce((best, curr) => {
    const bestHeight = best.height || 0;
    const currHeight = curr.height || 0;
    return currHeight >= bestHeight ? curr : best;
  }, validFiles[0]);
}

/**
 * Picks the highest resolution image URL from a Pinterest rendition dictionary,
 * attempting to resolve uncompressed /originals/ and preserving animated GIFs.
 */
async function resolveBestImage(
  imagesMap?: Record<string, PinterestRendition>,
  isAnimated?: boolean
): Promise<{ url: string; width?: number; height?: number; bytes?: number; isGif?: boolean } | null> {
  if (!imagesMap) return null;

  // 1. Check direct 'orig' or 'originals'
  const origCandidate = imagesMap.orig || imagesMap.originals;
  if (origCandidate?.url) {
    let targetUrl = origCandidate.url;
    if (isAnimated && !targetUrl.endsWith('.gif')) {
      const gifCandidate = targetUrl.replace(/\.[a-zA-Z0-9]+(\?|$)/, '.gif$1');
      const gifBytes = await getRealContentLength(gifCandidate);
      if (gifBytes && gifBytes > 0) {
        return {
          url: gifCandidate,
          width: origCandidate.width,
          height: origCandidate.height,
          bytes: gifBytes,
          isGif: true,
        };
      }
    }

    const bytes = await getRealContentLength(targetUrl);
    return {
      url: targetUrl,
      width: origCandidate.width,
      height: origCandidate.height,
      bytes,
      isGif: /\.gif(\?|$)/i.test(targetUrl),
    };
  }

  const tallest = selectTallestMediaFile(imagesMap);
  if (!tallest?.url) return null;

  // If URL is from i.pinimg.com and contains a resolution folder like /564x/ or /736x/,
  // attempt to query the full-resolution /originals/ master frame.
  if (tallest.url.includes('i.pinimg.com') && /\/\d+x\//.test(tallest.url)) {
    // If animated, check .gif on originals
    if (isAnimated || /\.gif(\?|$)/i.test(tallest.url)) {
      const gifUrl = tallest.url.replace(/\/\d+x\//, '/originals/').replace(/\.[a-zA-Z0-9]+(\?|$)/, '.gif$1');
      const gifBytes = await getRealContentLength(gifUrl);
      if (gifBytes && gifBytes > 0) {
        return {
          url: gifUrl,
          width: tallest.width,
          height: tallest.height,
          bytes: gifBytes,
          isGif: true,
        };
      }
    }

    const originalsUrl = tallest.url.replace(/\/\d+x\//, '/originals/');
    const origBytes = await getRealContentLength(originalsUrl);
    if (origBytes && origBytes > 0) {
      return {
        url: originalsUrl,
        width: tallest.width,
        height: tallest.height,
        bytes: origBytes,
        isGif: /\.gif(\?|$)/i.test(originalsUrl),
      };
    }
  }

  const baseBytes = await getRealContentLength(tallest.url);
  return {
    url: tallest.url,
    width: tallest.width,
    height: tallest.height,
    bytes: baseBytes,
    isGif: /\.gif(\?|$)/i.test(tallest.url),
  };
}

/**
 * Extracts all slides/blocks from a Story Pin, Carousel Pin, or Root Media.
 */
async function extractAllSlides(pin: PinterestPinData, pinId: string): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  const seenUrls = new Set<string>();

  // 1. Process story_pin_data.pages (Story Pins / Idea Pins)
  const pages = pin.story_pin_data?.pages || [];
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];
    let slideAdded = false;

    // Check if page has a direct video
    const pageVideoMap = page.video?.video_list;
    if (pageVideoMap) {
      const bestVideo = selectTallestMediaFile(pageVideoMap);
      if (bestVideo?.url && !seenUrls.has(bestVideo.url)) {
        seenUrls.add(bestVideo.url);
        const bytes = await getRealContentLength(bestVideo.url);
        const thumbObj = page.image?.images ? await resolveBestImage(page.image.images, pin.is_animated) : null;

        items.push({
          id: `pin-slide-${pinId}-${items.length + 1}`,
          type: 'video',
          url: bestVideo.url,
          thumbnail: thumbObj?.url || bestVideo.thumbnail || bestVideo.url,
          extension: 'MP4',
          size: formatBytes(bytes),
          label: `Slide ${items.length + 1} (Video)`,
        });
        slideAdded = true;
      }
    }

    // Check blocks for video blocks first (prioritize video over image covers)
    if (!slideAdded && page.blocks && page.blocks.length > 0) {
      for (const block of page.blocks) {
        const blockVideoMap = block.video?.video_list;
        if (blockVideoMap) {
          const bestVideo = selectTallestMediaFile(blockVideoMap);
          if (bestVideo?.url && !seenUrls.has(bestVideo.url)) {
            seenUrls.add(bestVideo.url);
            const bytes = await getRealContentLength(bestVideo.url);
            const thumbObj = block.image?.images ? await resolveBestImage(block.image.images, pin.is_animated) : null;

            items.push({
              id: `pin-slide-${pinId}-${items.length + 1}`,
              type: 'video',
              url: bestVideo.url,
              thumbnail: thumbObj?.url || bestVideo.thumbnail || bestVideo.url,
              extension: 'MP4',
              size: formatBytes(bytes),
              label: `Slide ${items.length + 1} (Video)`,
            });
            slideAdded = true;
            break;
          }
        }
      }
    }

    // If no video, check blocks for image blocks
    if (!slideAdded && page.blocks && page.blocks.length > 0) {
      for (const block of page.blocks) {
        if (block.image?.images) {
          const bestImg = await resolveBestImage(block.image.images, pin.is_animated);
          if (bestImg?.url && !seenUrls.has(bestImg.url)) {
            seenUrls.add(bestImg.url);
            let ext = 'JPG';
            if (bestImg.isGif || /\.gif(\?|$)/i.test(bestImg.url)) ext = 'GIF';
            else if (/\.png(\?|$)/i.test(bestImg.url)) ext = 'PNG';
            else if (/\.webp(\?|$)/i.test(bestImg.url)) ext = 'WEBP';

            items.push({
              id: `pin-slide-${pinId}-${items.length + 1}`,
              type: 'image',
              url: bestImg.url,
              thumbnail: bestImg.url,
              extension: ext,
              size: formatBytes(bestImg.bytes),
              label: `Slide ${items.length + 1} (${ext})`,
            });
            slideAdded = true;
            break;
          }
        }
      }
    }

    // If still no media added for this page, check page.image / page.image_adjusted
    if (!slideAdded) {
      const pageImages =
        page.image?.images ||
        (page as { image_adjusted?: { images?: Record<string, PinterestRendition> } }).image_adjusted?.images;
      if (pageImages) {
        const bestImg = await resolveBestImage(pageImages, pin.is_animated);
        if (bestImg?.url && !seenUrls.has(bestImg.url)) {
          seenUrls.add(bestImg.url);
          let ext = 'JPG';
          if (bestImg.isGif || /\.gif(\?|$)/i.test(bestImg.url)) ext = 'GIF';
          else if (/\.png(\?|$)/i.test(bestImg.url)) ext = 'PNG';
          else if (/\.webp(\?|$)/i.test(bestImg.url)) ext = 'WEBP';

          items.push({
            id: `pin-slide-${pinId}-${items.length + 1}`,
            type: 'image',
            url: bestImg.url,
            thumbnail: bestImg.url,
            extension: ext,
            size: formatBytes(bestImg.bytes),
            label: `Slide ${items.length + 1} (${ext})`,
          });
        }
      }
    }
  }

  // 2. Process carousel_data.carousel_slots (Standard Carousel Pins)
  const slots = pin.carousel_data?.carousel_slots || [];
  for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
    const slot = slots[slotIdx];
    if (slot.videos?.video_list) {
      const bestVideo = selectTallestMediaFile(slot.videos.video_list);
      if (bestVideo?.url && !seenUrls.has(bestVideo.url)) {
        seenUrls.add(bestVideo.url);
        const bytes = await getRealContentLength(bestVideo.url);
        const slotThumb = slot.images ? await resolveBestImage(slot.images, pin.is_animated) : null;
        items.push({
          id: `pin-slot-${pinId}-${items.length + 1}`,
          type: 'video',
          url: bestVideo.url,
          thumbnail: slotThumb?.url || bestVideo.thumbnail || bestVideo.url,
          extension: 'MP4',
          size: formatBytes(bytes),
          label: `Slide ${items.length + 1} (Video)`,
        });
        continue;
      }
    }

    if (slot.images) {
      const bestImg = await resolveBestImage(slot.images, pin.is_animated);
      if (bestImg?.url && !seenUrls.has(bestImg.url)) {
        seenUrls.add(bestImg.url);
        let ext = 'JPG';
        if (bestImg.isGif || /\.gif(\?|$)/i.test(bestImg.url)) ext = 'GIF';
        else if (/\.png(\?|$)/i.test(bestImg.url)) ext = 'PNG';
        else if (/\.webp(\?|$)/i.test(bestImg.url)) ext = 'WEBP';

        items.push({
          id: `pin-slot-${pinId}-${items.length + 1}`,
          type: 'image',
          url: bestImg.url,
          thumbnail: bestImg.url,
          extension: ext,
          size: formatBytes(bestImg.bytes),
          label: `Slide ${items.length + 1} (${ext})`,
        });
      }
    }
  }

  return items;
}

/**
 * Resolves the cleanest contextual title using the specified priority hierarchy:
 * 1. pin.grid_title (clean stripped string)
 * 2. pin.title
 * 3. pin.rich_metadata?.title
 * 4. pin.story_pin_data?.metadata?.root?.title
 * 5. HTML <title> tag on canonical page
 * 6. Fallback: Creator's name / username (e.g., "Post by ${creatorName}")
 */
async function resolvePinTitle(
  pin: PinterestPinData,
  pinId: string,
  creatorName: string,
  canonicalUrl: string
): Promise<string> {
  if (pin.grid_title?.trim()) {
    const t = decodeHtmlEntities(pin.grid_title.trim());
    if (t) return t;
  }

  if (pin.title?.trim()) {
    const t = decodeHtmlEntities(pin.title.trim());
    if (t) return t;
  }

  if (pin.rich_metadata?.title?.trim()) {
    const t = decodeHtmlEntities(pin.rich_metadata.title.trim());
    if (t) return t;
  }

  const storyRootTitle = (pin.story_pin_data as { metadata?: { root?: { title?: string } } })?.metadata?.root?.title;
  if (storyRootTitle?.trim()) {
    const t = decodeHtmlEntities(storyRootTitle.trim());
    if (t) return t;
  }

  // Check HTML title tag on canonical page (cleaning trailing " | Pinterest")
  try {
    const pageUrl = canonicalUrl.includes('/pin/') ? canonicalUrl : `https://www.pinterest.com/pin/${pinId}/`;
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/<title>([^<]+)<\/title>/i);
      if (match && match[1]) {
        const cleaned = match[1].replace(/\s*\|\s*Pinterest\s*$/i, '').trim();
        if (cleaned && cleaned.toLowerCase() !== 'pinterest') {
          return decodeHtmlEntities(cleaned);
        }
      }
    }
  } catch {
    // Graceful fallback
  }

  if (pin.board?.name?.trim()) {
    const t = decodeHtmlEntities(pin.board.name.trim());
    if (t) return t;
  }

  if (creatorName && creatorName !== 'Pinterest Creator') {
    return `Post by ${creatorName}`;
  }

  return `Pinterest Media`;
}

/**
 * Resolves description following the hierarchy:
 * 1. pin.description (if trimmed non-empty and != title)
 * 2. pin.rich_metadata?.description (if trimmed non-empty and != title)
 * 3. pin.story_pin_data?.metadata?.root?.title (if != title)
 * 4. Fallback: undefined (do not duplicate the title as description)
 */
function resolvePinDescription(pin: PinterestPinData, resolvedTitle: string): string | undefined {
  if (pin.description?.trim()) {
    const desc = decodeHtmlEntities(pin.description.trim());
    if (desc && desc.toLowerCase() !== resolvedTitle.toLowerCase()) {
      return desc;
    }
  }

  if (pin.rich_metadata?.description?.trim()) {
    const desc = decodeHtmlEntities(pin.rich_metadata.description.trim());
    if (desc && desc.toLowerCase() !== resolvedTitle.toLowerCase()) {
      return desc;
    }
  }

  const storyRootTitle = (pin.story_pin_data as { metadata?: { root?: { title?: string } } })?.metadata?.root?.title;
  if (storyRootTitle?.trim()) {
    const desc = decodeHtmlEntities(storyRootTitle.trim());
    if (desc && desc.toLowerCase() !== resolvedTitle.toLowerCase()) {
      return desc;
    }
  }

  return undefined;
}

/**
 * Primary Provider: Extract Pinterest media pin via Pinterest widget API.
 */
async function fetchFromPinterestWidget(pinId: string, canonicalUrl: string): Promise<MediaResult | null> {
  const endpoint = `https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${pinId}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network failure';
    throw new ExtractionPipelineError('GATEWAY_TIMEOUT', 'Failed to connect to Pinterest widget API.', {
      technicalDetail: `Connection error: ${errorMsg}`,
      platform: 'pinterest',
      statusHint: 504,
    });
  }

  if (res.status === 429) {
    throw new ExtractionPipelineError('RATE_LIMITED', 'Pinterest extraction endpoint is rate-limited. Please wait a few seconds before retrying.', {
      platform: 'pinterest',
      statusHint: 429,
    });
  }

  if (!res.ok) {
    throw new ExtractionPipelineError('GATEWAY_TIMEOUT', `Pinterest upstream returned HTTP status ${res.status}.`, {
      technicalDetail: `HTTP ${res.status} ${res.statusText}`,
      platform: 'pinterest',
      statusHint: 504,
    });
  }

  const json: PinterestWidgetResponse = await res.json();
  if (!json.data) {
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', 'Pinterest pin data is empty or inaccessible.', {
      platform: 'pinterest',
      statusHint: 422,
    });
  }

  let pin: PinterestPinData | undefined;
  if (Array.isArray(json.data)) {
    pin = json.data[0];
  } else if (Array.isArray(json.data.pins)) {
    pin = json.data.pins[0];
  }

  if (!pin || pin.error) {
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', 'Pinterest pin was not found, private, or has been removed.', {
      technicalDetail: pin?.error ? `Upstream error: ${pin.error}` : 'Pin object missing from response',
      platform: 'pinterest',
      statusHint: 422,
    });
  }

  // Fully decode author name, username, and handle entities
  const rawPinnerName = pin.pinner?.full_name || pin.pinner?.username || 'Pinterest Creator';
  const name = decodeHtmlEntities(rawPinnerName);

  const profileUrlMatch = pin.pinner?.profile_url
    ? pin.pinner.profile_url.match(/pinterest\.[a-z.]+\/([a-zA-Z0-9_.-]+)/i)
    : null;
  const rawHandle = pin.pinner?.username || (profileUrlMatch ? profileUrlMatch[1] : null);
  const decodedHandle = rawHandle
    ? decodeHtmlEntities(rawHandle)
    : pin.pinner?.full_name
      ? decodeHtmlEntities(pin.pinner.full_name.toLowerCase().replace(/\s+/g, ''))
      : 'pinterest.creator';
  const username = `@${decodedHandle.replace(/^@+/, '')}`;

  // Resolve Title and Description using the robust hierarchy
  const title = await resolvePinTitle(pin, pinId, name, canonicalUrl);
  const description = resolvePinDescription(pin, title);

  // 1. Try extracting multi-slide carousel / story pin
  const slides = await extractAllSlides(pin, pinId);

  if (slides.length > 1) {
    const formats: MediaFormat[] = [
      {
        id: `pin-zip-${pinId}`,
        type: 'archive',
        label: `Full Collection Archive (${slides.length} Slides)`,
        quality: 'Lossless ZIP Package',
        extension: 'ZIP',
        size: `${slides.length} Files`,
        downloadUrl: '#zip',
        isLossless: true,
      },
    ];

    // Add individual stream formats
    for (const slide of slides) {
      formats.push({
        id: slide.id,
        type: slide.type,
        label: slide.label || `Slide ${slide.id.split('-').pop()}`,
        quality: 'Source Asset',
        extension: slide.extension,
        size: slide.size || 'Direct Stream',
        downloadUrl: slide.url,
        isLossless: true,
      });
    }

    return {
      id: `pin-${pinId}`,
      originalUrl: canonicalUrl,
      platform: 'pinterest',
      title,
      description,
      author: {
        name,
        handle: username,
        avatar: pin.pinner?.image_small_url,
      },
      thumbnail: slides[0].thumbnail,
      extractedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      formats,
      items: slides,
      isCollection: true,
      itemCount: slides.length,
    };
  }

  // 2. Single item fallback from root media (Video takes strict priority over static images)
  const singleVideo =
    selectTallestMediaFile(pin.videos?.video_list) ||
    (slides.length === 1 && slides[0].type === 'video' ? { url: slides[0].url } : null);

  const singleImage =
    (slides.length === 1 && slides[0].type === 'image'
      ? { url: slides[0].url, bytes: undefined, isGif: slides[0].extension === 'GIF' }
      : await resolveBestImage(pin.images, pin.is_animated));

  if (!singleVideo && !singleImage) return null;

  const formats: MediaFormat[] = [];

  // Resolve duration from the best video rendition (duration stored as ms in video_list)
  const pinVideoDurationMs = singleVideo && 'duration' in singleVideo ? (singleVideo.duration as number) : undefined;
  const pinVideoDuration = pinVideoDurationMs && pinVideoDurationMs > 0
    ? formatDuration(pinVideoDurationMs / 1000)
    : undefined;

  const isMultiClipPin = Boolean(
    (pin.story_pin_data && (pin.story_pin_data.page_count ?? 0) > 1) ||
    (pin.carousel_data && (pin.carousel_data.carousel_slots?.length ?? 0) > 1)
  );

  if (singleVideo) {
    const realVideoBytes = await getRealContentLength(singleVideo.url);
    const isAnimatedVideo = Boolean(pin.is_animated || (!pinVideoDuration && pin.is_video));

    const videoLabel = isMultiClipPin
      ? 'First Clip Only (Full Clip Set Unavailable)'
      : isAnimatedVideo
      ? 'Animated Video (MP4)'
      : 'Original Video (No Watermark)';

    const videoQuality = isMultiClipPin
      ? 'Source MP4 Clip'
      : isAnimatedVideo
      ? 'Animated Source MP4'
      : 'Source MP4';

    formats.push({
      id: `pin-v-${pinId}`,
      type: 'video',
      label: videoLabel,
      quality: videoQuality,
      extension: 'MP4',
      size: formatBytes(realVideoBytes),
      downloadUrl: singleVideo.url,
      isLossless: true,
    });
  } else if (singleImage) {
    let ext = 'JPG';
    if (singleImage.isGif || /\.gif(\?|$)/i.test(singleImage.url)) ext = 'GIF';
    else if (/\.png(\?|$)/i.test(singleImage.url)) ext = 'PNG';
    else if (/\.webp(\?|$)/i.test(singleImage.url)) ext = 'WEBP';

    const imageLabel = isMultiClipPin
      ? 'Cover Image (Full Carousel Unavailable)'
      : ext === 'GIF'
      ? 'Original Animated GIF'
      : 'Original High-Res Asset';

    const imageQuality = isMultiClipPin
      ? 'Master Cover Frame'
      : ext === 'GIF'
      ? 'Animated Source'
      : 'Master Grade';

    formats.push({
      id: `pin-img-${pinId}`,
      type: 'image',
      label: imageLabel,
      quality: imageQuality,
      extension: ext,
      size: formatBytes(singleImage.bytes),
      downloadUrl: singleImage.url,
      isLossless: true,
    });
  }

  const thumbnail = singleImage?.url || singleVideo?.thumbnail || singleVideo?.url || '';

  return {
    id: `pin-${pinId}`,
    originalUrl: canonicalUrl,
    platform: 'pinterest',
    title,
    description,
    author: {
      name,
      handle: username,
      avatar: pin.pinner?.image_small_url,
    },
    thumbnail,
    duration: pinVideoDuration,
    extractedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    formats,
  };
}

/**
 * Queries Pinterest widget API for public boards and maps up to 50 curated pins.
 */
export async function fetchFromPinterestBoardWidget(user: string, board: string, canonicalUrl: string): Promise<MediaResult> {
  const widgetEndpoint = `https://widgets.pinterest.com/v3/pidgets/boards/${encodeURIComponent(user)}/${encodeURIComponent(board)}/pins/`;

  const response = await fetch(widgetEndpoint, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (response.status === 404) {
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', `Pinterest board "${user}/${board}" not found. The board may be private, deleted, or the URL is incorrect.`, {
      platform: 'pinterest',
      statusHint: 404,
    });
  }

  if (!response.ok) {
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', `Failed to query Pinterest board endpoint (HTTP ${response.status}).`, {
      platform: 'pinterest',
      statusHint: 502,
    });
  }

  const json = await response.json();
  if (json.status === 'failure' || !json.data?.pins || json.data.pins.length === 0) {
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', `Pinterest board "${user}/${board}" has no accessible pins or does not exist.`, {
      platform: 'pinterest',
      statusHint: 404,
    });
  }

  const rawPins = json.data.pins;
  const items: MediaItem[] = await Promise.all(
    rawPins.slice(0, 50).map(async (p: { id?: string; images?: Record<string, { url?: string }> }, idx: number) => {
      const rawImgUrl = p.images?.['564x']?.url || p.images?.['236x']?.url || '';
      const origUrl = rawImgUrl.includes('i.pinimg.com') && /\/\d+x\//.test(rawImgUrl)
        ? rawImgUrl.replace(/\/\d+x\//, '/originals/')
        : rawImgUrl;

      const sizeBytes = await getRealContentLength(origUrl);
      return {
        id: `pin-item-${p.id || idx + 1}`,
        type: 'image' as const,
        url: origUrl,
        thumbnail: rawImgUrl || origUrl,
        extension: 'JPG',
        size: formatBytes(sizeBytes),
        label: `Photo ${idx + 1}`,
      };
    })
  );

  const formats: MediaFormat[] = [];
  if (items.length >= 2) {
    formats.push({
      id: `pin-board-zip-${user}-${board}`,
      type: 'archive',
      label: `All Photos (${items.length} Images)`,
      quality: 'Lossless ZIP Package',
      extension: 'ZIP',
      size: `${items.length} Files`,
      downloadUrl: '#zip',
      isLossless: true,
    });
  }

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

  const rawBoardTitle = json.data.board?.name ? decodeHtmlEntities(json.data.board.name) : `${user}'s ${board} Board`;
  const rawUserName = json.data.user?.full_name ? decodeHtmlEntities(json.data.user.full_name) : user;
  const rawUserAbout = json.data.user?.about ? decodeHtmlEntities(json.data.user.about) : `Pinterest board with ${items.length} curated pins.`;

  return {
    id: `pin-board-${user}-${board}`,
    originalUrl: canonicalUrl,
    platform: 'pinterest',
    title: `${rawBoardTitle} (${items.length} Pins)`,
    description: rawUserAbout,
    author: {
      name: rawUserName,
      handle: `@${user}`,
      avatar: json.data.user?.image_small_url,
    },
    thumbnail: items[0]?.thumbnail || items[0]?.url || '',
    isCollection: items.length >= 2,
    itemCount: items.length,
    items,
    extractedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    formats,
  };
}

/**
 * Main Pinterest Extractor function.
 * Resolves short links, extracts Pin ID or Board parameters, queries widget endpoint, and returns authentic MediaResult.
 */
export async function extractPinterest(url: string): Promise<MediaResult> {
  const canonicalUrl = await resolvePinterestUrl(url.trim());
  const pinId = extractPinterestId(canonicalUrl);

  if (pinId) {
    const result = await fetchFromPinterestWidget(pinId, canonicalUrl);
    if (result && result.formats.length > 0) {
      return result;
    }
  }

  const boardInfo = extractPinterestBoardInfo(canonicalUrl);
  if (boardInfo) {
    const boardResult = await fetchFromPinterestBoardWidget(boardInfo.user, boardInfo.board, canonicalUrl);
    if (boardResult && boardResult.formats.length > 0) {
      return boardResult;
    }
  }

  if (url.includes('pin.it')) {
    throw new ExtractionPipelineError(
      'MEDIA_UNREACHABLE',
      'This Pinterest short link (pin.it) could not be resolved. The pin may have been deleted, set to private, or the link has expired.',
      {
        platform: 'pinterest',
        statusHint: 404,
      }
    );
  }

  throw new ExtractionPipelineError('INVALID_URL', 'Unable to parse valid Pinterest Pin ID or Board from URL. Supported formats: pinterest.com/pin/12345/ or pinterest.com/user/board/ or pin.it/...', {
    platform: 'pinterest',
    statusHint: 400,
  });
}
