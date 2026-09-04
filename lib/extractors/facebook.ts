import { MediaResult, MediaFormat, MediaItem } from '@/types';
import { ExtractionPipelineError } from './errors';
import { getRealContentLength, formatBytes, formatDuration } from './utils';
import { decodeHtmlEntities } from '@/lib/utils';

export type FacebookContentType =
  | 'reel'
  | 'video'
  | 'photo'
  | 'album'
  | 'group_post'
  | 'post'
  | 'unknown';

export const FB_DESKTOP_HEADERS: HeadersInit = {
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

export const FB_GRAPHQL_HEADERS: HeadersInit = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Origin': 'https://www.facebook.com',
  'Content-Type': 'application/x-www-form-urlencoded',
};

/**
 * Resolves shortened Facebook URLs (e.g. fb.watch, fb.com) and normalizes mobile/touch subdomains
 * to canonical www.facebook.com desktop URLs.
 */
export async function resolveFacebookUrl(inputUrl: string): Promise<string> {
  let currentUrl = inputUrl.trim();
  if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
    currentUrl = `https://${currentUrl}`;
  }

  // Rewrite mobile & alternate hostnames directly to www.facebook.com
  try {
    const parsed = new URL(currentUrl);
    if (
      ['m.facebook.com', 'web.facebook.com', 'touch.facebook.com', 'mobile.facebook.com'].includes(
        parsed.hostname.toLowerCase()
      )
    ) {
      parsed.hostname = 'www.facebook.com';
      currentUrl = parsed.toString();
    }
  } catch {
    // If URL parsing fails, continue to redirect resolver
  }

  // Follow redirects for shortlinks (fb.watch, fb.com, bit.ly, etc.)
  if (currentUrl.includes('fb.watch') || currentUrl.includes('fb.com') || currentUrl.includes('/share/')) {
    try {
      for (let hop = 0; hop < 4; hop++) {
        const res = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: FB_DESKTOP_HEADERS,
          signal: AbortSignal.timeout(6000),
        });

        const location = res.headers.get('location');
        if (!location) break;

        let nextTarget = location;
        if (nextTarget.startsWith('/')) {
          const origin = new URL(currentUrl).origin;
          nextTarget = `${origin}${nextTarget}`;
        }

        currentUrl = nextTarget;
        if (currentUrl.includes('facebook.com') && !currentUrl.includes('fb.watch') && !currentUrl.includes('/share/')) {
          break;
        }
      }
    } catch {
      // Graceful fallback if redirect resolution times out
    }
  }

  // Ensure final target is www.facebook.com
  try {
    const finalParsed = new URL(currentUrl);
    if (
      ['m.facebook.com', 'web.facebook.com', 'touch.facebook.com', 'mobile.facebook.com'].includes(
        finalParsed.hostname.toLowerCase()
      )
    ) {
      finalParsed.hostname = 'www.facebook.com';
      currentUrl = finalParsed.toString();
    }
  } catch {}

  return currentUrl;
}

/**
 * Classifies the Facebook content type using precise canonical URL patterns.
 */
export function identifyFacebookContentType(url: string): FacebookContentType {
  const clean = url.trim().toLowerCase();

  // 1. Reel
  if (/\/reel\/\d+/i.test(clean)) return 'reel';

  // 2. Video / Watch
  if (
    /\/videos\/\d+/i.test(clean) ||
    /\/watch\/?\?v=\d+/i.test(clean) ||
    /fb\.watch\//i.test(clean)
  ) {
    return 'video';
  }

  // 3. Album / Mediaset (Page album, Group album, /media/set/, /photos/albums/, /albums/, /photos/a.)
  if (
    /\/media\/set\/?\?set=a\.\d+/i.test(clean) ||
    /set=a\.\d+/i.test(clean) ||
    /\/photos\/albums\/\d+/i.test(clean) ||
    /\/albums\/\d+/i.test(clean) ||
    /\/photos\/a\.\d+/i.test(clean)
  ) {
    return 'album';
  }

  // 4. Single Photo
  if (
    /\/photo(?:\.php|\/)\?[^"'\s<>]*fbid=\d+/i.test(clean) ||
    /\/photos\/[^"'\s<>]+\/\d+/i.test(clean)
  ) {
    return 'photo';
  }

  // 5. Group Post or Group Link
  if (
    /\/groups\/[^\/]+(?:\/posts\/\d+|\/permalink\/\d+|\/?$)/i.test(clean)
  ) {
    return 'group_post';
  }

  // 6. Generic Page Post / Story Permalink
  if (/\/posts\/[0-9a-zA-Z_.-]+/i.test(clean) || /permalink\.php\?[^"'\s<>]*story_fbid=/i.test(clean)) {
    return 'post';
  }

  return 'unknown';
}

/**
 * Strips Facebook CDN sizing constraints (&ctp=...) from image URLs to unlock
 * the unconstrained master resolution asset (e.g. 2048px).
 */
export function stripImageSizingParams(rawUrl?: string): string {
  if (!rawUrl) return '';
  const unescaped = rawUrl
    .replace(/\\\//g, '/')
    .replace(/\\u00253A/g, ':')
    .replace(/\\u00252F/g, '/')
    .replace(/&amp;/g, '&');
  // Remove the ctp sizing param (e.g. &ctp=s417x417 or ?ctp=s417x417)
  return unescaped
    .replace(/([?&])ctp=[^&]+(&|$)/, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?');
}

/**
 * Extracts isolated audio stream URL from a DASH MPD manifest XML string.
 */
export function extractAudioFromDashManifest(dashXml?: string): string | null {
  if (!dashXml) return null;
  try {
    const audioAdaptationMatch = dashXml.match(
      /<AdaptationSet[^>]*contentType="audio"[^>]*>([\s\S]*?)<\/AdaptationSet>/i
    );
    if (!audioAdaptationMatch) {
      // Secondary match for mimeType="audio/mp4"
      const mimeMatch = dashXml.match(/<AdaptationSet[^>]*mimeType="audio\/mp4"[^>]*>([\s\S]*?)<\/AdaptationSet>/i);
      if (!mimeMatch) return null;
      const baseMatch = mimeMatch[1].match(/<BaseURL>([^<]+)<\/BaseURL>/i);
      return baseMatch ? baseMatch[1].replace(/&amp;/g, '&') : null;
    }
    const baseMatch = audioAdaptationMatch[1].match(/<BaseURL>([^<]+)<\/BaseURL>/i);
    return baseMatch ? baseMatch[1].replace(/&amp;/g, '&') : null;
  } catch {
    return null;
  }
}

/**
 * Recursively searches a parsed JSON structure for semantic target keys.
 * Resilient against Facebook Comet layout shifts across different builds.
 */
export function findSemanticKeys(
  root: unknown,
  targetKeys: string[],
  maxDepth = 25
): Record<string, unknown[]> {
  const results: Record<string, unknown[]> = {};
  for (const k of targetKeys) {
    results[k] = [];
  }

  const seen = new Set<unknown>();

  function walk(current: unknown, depth: number) {
    if (!current || typeof current !== 'object' || depth > maxDepth) return;
    if (seen.has(current)) return;
    seen.add(current);

    if (Array.isArray(current)) {
      for (const item of current) {
        walk(item, depth + 1);
      }
      return;
    }

    const record = current as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (results[key]) {
        results[key].push(value);
      }
      walk(value, depth + 1);
    }
  }

  walk(root, 0);
  return results;
}

interface OpenGraphTags {
  title?: string;
  description?: string;
  image?: string;
  video?: string;
  type?: string;
}

/**
 * Extracts statically rendered OpenGraph meta tags from raw page HTML as a reliable fallback.
 */
export function extractOpenGraphTags(html: string): OpenGraphTags {
  const tags: OpenGraphTags = {};
  const metaRegex = /<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"/gi;
  let match: RegExpExecArray | null;

  while ((match = metaRegex.exec(html)) !== null) {
    const prop = match[1].toLowerCase();
    const val = decodeHtmlEntities(match[2].trim());
    if (prop === 'og:title') tags.title = val;
    else if (prop === 'og:description') tags.description = val;
    else if (prop === 'og:image') tags.image = val;
    else if (prop === 'og:video' || prop === 'og:video:secure_url' || prop === 'og:video:url') {
      if (!tags.video) tags.video = val;
    } else if (prop === 'og:type') tags.type = val;
  }

  return tags;
}

/**
 * Parses engagement metrics (e.g. "1.6K views · 24 reactions") and author name
 * commonly embedded in Facebook's og:title tag.
 */
function parseOgTitleDetails(ogTitle?: string): {
  author?: string;
  cleanTitle?: string;
  views?: string;
  likes?: string;
} {
  if (!ogTitle) return {};
  let str = ogTitle.trim();

  let views: string | undefined;
  let likes: string | undefined;

  // Pattern: "1.6K views · 24 reactions | Title | Author"
  const statsMatch = str.match(/^([\d.,]+[KMB]?\s+views)?\s*(?:·|&middot;)?\s*([\d.,]+[KMB]?\s+reactions)?\s*\|\s*/i);
  if (statsMatch) {
    if (statsMatch[1]) views = statsMatch[1].replace(/\s*views/i, '').trim();
    if (statsMatch[2]) likes = statsMatch[2].replace(/\s*reactions/i, '').trim();
    str = str.slice(statsMatch[0].length).trim();
  }

  // Split by pipe to separate title from author suffix
  const parts = str.split('|').map((p) => p.trim()).filter(Boolean);
  let author: string | undefined;
  let cleanTitle: string = str;

  if (parts.length >= 2) {
    author = parts[parts.length - 1];
    cleanTitle = parts.slice(0, parts.length - 1).join(' | ');
  } else if (parts.length === 1) {
    cleanTitle = parts[0];
  }

  // Clean trailing " - Facebook" or "| Facebook"
  cleanTitle = cleanTitle.replace(/\s*[-|]\s*Facebook$/i, '').trim();
  if (author) {
    author = author.replace(/\s*[-|]\s*Facebook$/i, '').trim();
  }

  return { author, cleanTitle, views, likes };
}

/**
 * Fetches page HTML with full desktop navigation headers, checking for login walls & checkpoints.
 */
async function fetchFacebookHtml(url: string): Promise<{ html: string; finalUrl: string }> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: FB_DESKTOP_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Connection failed';
    throw new ExtractionPipelineError('GATEWAY_TIMEOUT', 'Failed to establish connection to Facebook upstream gateway.', {
      technicalDetail: `Fetch error: ${errorMsg}`,
      platform: 'facebook',
      statusHint: 504,
    });
  }

  const finalUrl = res.url || url;

  // Check login wall / private group redirect
  if (finalUrl.includes('/login') || finalUrl.includes('login.php')) {
    throw new ExtractionPipelineError(
      'MEDIA_UNREACHABLE',
      'This Facebook post, video, or group is private or login-protected.',
      {
        technicalDetail: `Redirected to login endpoint: ${finalUrl}`,
        platform: 'facebook',
        statusHint: 422,
      }
    );
  }

  // Check rate-limiting checkpoint
  if (res.status === 429 || finalUrl.includes('checkpoint') || finalUrl.includes('/challenge/')) {
    throw new ExtractionPipelineError(
      'RATE_LIMITED',
      'Upstream Facebook extraction gateway is rate-limited. Please wait a moment before retrying.',
      {
        technicalDetail: `Upstream status: ${res.status}, URL: ${finalUrl}`,
        platform: 'facebook',
        statusHint: 429,
      }
    );
  }

  if (res.status === 404) {
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', 'The requested Facebook content was not found or has been removed.', {
      platform: 'facebook',
      statusHint: 404,
    });
  }

  const html = await res.text();

  // Content unavailability screen detection
  if (
    html.includes('This content isn&#039;t available right now') ||
    html.includes("This content isn't available right now") ||
    html.includes('When this happens, it&#039;s usually because the owner only shared it with a small group of people')
  ) {
    throw new ExtractionPipelineError('MEDIA_UNREACHABLE', 'This Facebook post is unavailable, deleted, or restricted.', {
      platform: 'facebook',
      statusHint: 422,
    });
  }

  return { html, finalUrl };
}

/**
 * Extracts and parses all <script> JSON blobs containing __bbox from page HTML.
 */
function extractBboxJsonObjects(html: string): unknown[] {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  const jsonObjects: unknown[] = [];

  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1];
    if (content.includes('__bbox')) {
      try {
        jsonObjects.push(JSON.parse(content));
      } catch {
        // Attempt to find embedded JSON substring if wrapped in JS call
        const braceIdx = content.indexOf('{');
        const lastBraceIdx = content.lastIndexOf('}');
        if (braceIdx !== -1 && lastBraceIdx > braceIdx) {
          try {
            jsonObjects.push(JSON.parse(content.substring(braceIdx, lastBraceIdx + 1)));
          } catch {}
        }
      }
    }
  }

  return jsonObjects;
}

/**
 * Primary Facebook Extraction Pipeline.
 * Authentically extracts:
 * 1. Videos & Reels: HD MP4 + SD MP4 + Isolated Soundtrack (via DASH audio)
 * 2. Single Photos: Pristine unconstrained master JPEG
 * 3. Photo Albums: All collection photos + Lossless ZIP Package
 * 4. Group Posts: Photo / Video with private-group protection
 */
export async function extractFacebook(inputUrl: string): Promise<MediaResult> {
  const canonicalUrl = await resolveFacebookUrl(inputUrl);
  const contentType = identifyFacebookContentType(canonicalUrl);

  if (contentType === 'unknown') {
    throw new ExtractionPipelineError(
      'INVALID_URL',
      "This doesn't look like a supported Facebook link. Please verify the URL and try again.",
      {
        technicalDetail: `Unrecognized Facebook URL structure: ${canonicalUrl}`,
        platform: 'facebook',
        statusHint: 400,
      }
    );
  }

  const { html, finalUrl } = await fetchFacebookHtml(canonicalUrl);
  const lsdMatch =
    html.match(/"LSD",\[\],\{"token":"([^"]+)"\}/) ||
    html.match(/name="lsd"\s+value="([^"]+)"/);
  const lsdToken = lsdMatch ? lsdMatch[1] : '';

  const og = extractOpenGraphTags(html);
  const ogDetails = parseOgTitleDetails(og.title);
  const jsonObjects = extractBboxJsonObjects(html);

  // Search across all parsed JSON scripts for key semantic nodes
  const semanticHits = findSemanticKeys(jsonObjects, [
    'videoDeliveryLegacyFields',
    'currMedia',
    'grid_media',
    'group_mediaset',
    'all_subattachments',
    'subattachments',
    'attachments',
    'short_form_video_context',
    'creation_story',
    'media',
    'story',
  ]);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Facebook Extractor Debug]', {
      canonicalUrl,
      contentType,
      jsonScriptCount: jsonObjects.length,
      gridMediaHits: semanticHits.grid_media?.length || 0,
      groupMediasetHits: semanticHits.group_mediaset?.length || 0,
      allSubattachmentsHits: semanticHits.all_subattachments?.length || 0,
      subattachmentsHits: semanticHits.subattachments?.length || 0,
    });
  }

  // Extract ID from URL for stable resource identification
  const idMatch =
    canonicalUrl.match(/(?:videos|reel|photos|posts)\/([0-9a-zA-Z_.-]+)/i) ||
    canonicalUrl.match(/[?&](?:v|fbid|set=a\.)(\d+)/i);
  const cleanId = idMatch ? idMatch[1] : String(Date.now());

  // Harvest photo candidates from grid_media, group_mediaset, all_subattachments & attachments
  interface RawPhotoCandidate {
    id?: string;
    uri: string;
    width: number;
    height: number;
    caption?: string;
  }

  const photoCandidates: RawPhotoCandidate[] = [];
  const candidateSeenUris = new Set<string>();

  const addPhotoCandidate = (rawNode: unknown) => {
    if (!rawNode || typeof rawNode !== 'object') return;
    const node = rawNode as Record<string, unknown>;
    const mediaObj = (node.media && typeof node.media === 'object' ? node.media : node) as Record<string, unknown>;

    const imgObj = (mediaObj.image || mediaObj.photo_image || mediaObj.viewer_image || node.image || node.photo_image || node.viewer_image) as
      | { uri?: string; width?: number; height?: number }
      | undefined;

    const rawUri = imgObj?.uri;
    if (!rawUri || typeof rawUri !== 'string') return;

    const masterUri = stripImageSizingParams(rawUri);
    if (candidateSeenUris.has(masterUri)) return;
    candidateSeenUris.add(masterUri);

    photoCandidates.push({
      id: typeof mediaObj.id === 'string' ? mediaObj.id : typeof node.id === 'string' ? node.id : undefined,
      uri: rawUri,
      width: imgObj.width || 2048,
      height: imgObj.height || 1365,
      caption: typeof mediaObj.accessibility_caption === 'string' ? mediaObj.accessibility_caption : undefined,
    });
  };

  let endCursor = '';
  let hasNextPage = false;

  // 1. Check grid_media (standard album pages)
  for (const gm of semanticHits.grid_media) {
    const gridObj = gm as {
      edges?: Array<{ node?: unknown }>;
      page_info?: { end_cursor?: string; has_next_page?: boolean };
    };
    if (Array.isArray(gridObj.edges)) {
      for (const edge of gridObj.edges) {
        if (edge?.node) addPhotoCandidate(edge.node);
      }
    }
    if (gridObj.page_info) {
      if (gridObj.page_info.end_cursor) endCursor = gridObj.page_info.end_cursor;
      if (gridObj.page_info.has_next_page !== undefined) hasNextPage = Boolean(gridObj.page_info.has_next_page);
    }
  }

  // 2. Check group_mediaset (group albums / group photo tabs)
  for (const gms of semanticHits.group_mediaset) {
    const gmsObj = gms as {
      media?: {
        edges?: Array<{ node?: unknown }>;
        page_info?: { end_cursor?: string; has_next_page?: boolean };
      };
    };
    if (Array.isArray(gmsObj.media?.edges)) {
      for (const edge of gmsObj.media.edges) {
        if (edge?.node) addPhotoCandidate(edge.node);
      }
    }
    if (gmsObj.media?.page_info) {
      if (gmsObj.media.page_info.end_cursor && !endCursor) endCursor = gmsObj.media.page_info.end_cursor;
      if (gmsObj.media.page_info.has_next_page !== undefined) hasNextPage = Boolean(gmsObj.media.page_info.has_next_page);
    }
  }

  // 3. Check all_subattachments & subattachments (multi-photo posts & group posts)
  for (const sub of [...semanticHits.all_subattachments, ...semanticHits.subattachments]) {
    const subObj = sub as { nodes?: Array<unknown> };
    if (Array.isArray(subObj.nodes)) {
      for (const node of subObj.nodes) {
        addPhotoCandidate(node);
      }
    }
  }

  // 4. Check attachments (fallback attachment trees)
  for (const att of semanticHits.attachments) {
    if (Array.isArray(att)) {
      for (const item of att) {
        const itemObj = item as {
          all_subattachments?: { nodes?: Array<unknown> };
          subattachments?: { nodes?: Array<unknown> };
          styles?: { attachment?: { media?: unknown } };
        };
        if (Array.isArray(itemObj.all_subattachments?.nodes)) {
          for (const node of itemObj.all_subattachments.nodes) addPhotoCandidate(node);
        }
        if (Array.isArray(itemObj.subattachments?.nodes)) {
          for (const node of itemObj.subattachments.nodes) addPhotoCandidate(node);
        }
        if (itemObj.styles?.attachment?.media) {
          addPhotoCandidate(itemObj.styles.attachment.media);
        }
      }
    }
  }

  // 5. Query GraphQL for Album Pagination if more photos exist beyond SSR initial batch
  if (hasNextPage && endCursor && (contentType === 'album' || photoCandidates.length > 0)) {
    let pageCount = 1;
    const MAX_PAGES = 5;
    const MAX_TOTAL_PHOTOS = 100;
    const albumTargetId = cleanId;

    while (hasNextPage && endCursor && pageCount <= MAX_PAGES && photoCandidates.length < MAX_TOTAL_PHOTOS) {
      pageCount++;
      try {
        const body = new URLSearchParams();
        body.append('doc_id', '34407011978913359');
        body.append('fb_api_req_friendly_name', 'ProfileCometLegacyAlbumGridViewPaginationQuery');
        body.append(
          'variables',
          JSON.stringify({
            count: 12,
            cursor: endCursor,
            id: albumTargetId,
            scale: 1,
          })
        );
        body.append('server_timestamps', 'true');
        if (lsdToken) body.append('lsd', lsdToken);

        const gqlRes = await fetch('https://www.facebook.com/api/graphql/', {
          method: 'POST',
          headers: {
            ...FB_GRAPHQL_HEADERS,
            Referer: canonicalUrl,
          },
          body: body.toString(),
          signal: AbortSignal.timeout(6000),
        });

        if (!gqlRes.ok) break;

        const text = await gqlRes.text();
        if (!text.startsWith('{')) break;

        const json = JSON.parse(text.trim().split('\n')[0]);
        const edges = json.data?.node?.grid_media?.edges;
        if (!Array.isArray(edges) || edges.length === 0) break;

        for (const edge of edges) {
          if (edge?.node) addPhotoCandidate(edge.node);
        }

        const pageInfo = json.data?.node?.grid_media?.page_info;
        hasNextPage = Boolean(pageInfo?.has_next_page);
        endCursor = pageInfo?.end_cursor || '';
      } catch {
        // Resilient fallback: GraphQL failure never crashes album extraction;
        // returns whatever photos have already been collected.
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. ALBUM / MULTI-PHOTO COLLECTION EXTRACTION
  // ─────────────────────────────────────────────────────────────
  const isCollectionEligible =
    (contentType === 'album' && photoCandidates.length > 0) ||
    photoCandidates.length > 1;

  if (isCollectionEligible) {
    const items: MediaItem[] = [];
    const seenUris = new Set<string>();

    const uniqueCandidates: RawPhotoCandidate[] = [];
    for (const candidate of photoCandidates) {
      const masterUri = stripImageSizingParams(candidate.uri);
      if (!seenUris.has(masterUri)) {
        seenUris.add(masterUri);
        uniqueCandidates.push(candidate);
      }
    }

    // Process file size inspection in parallel batches of 8 for fast throughput
    const chunkSize = 8;
    for (let i = 0; i < uniqueCandidates.length; i += chunkSize) {
      const chunk = uniqueCandidates.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (candidate, idx) => {
          const masterUri = stripImageSizingParams(candidate.uri);
          const bytes = await getRealContentLength(masterUri).catch(() => 0);
          const itemIndex = i + idx + 1;
          return {
            id: `fb-photo-${cleanId}-${itemIndex}`,
            type: 'image' as const,
            url: masterUri,
            thumbnail: candidate.uri,
            resolution: `${candidate.width}x${candidate.height}`,
            extension: 'JPG',
            size: formatBytes(bytes),
            label: `Photo ${itemIndex}`,
          };
        })
      );
      items.push(...chunkResults);
    }

    if (items.length > 0) {
      const formats: MediaFormat[] = [
        {
          id: `fb-zip-${cleanId}`,
          type: 'archive',
          label: `Full Collection Archive (${items.length} Photos)`,
          quality: 'Lossless ZIP Package',
          extension: 'ZIP',
          size: `${items.length} Files`,
          downloadUrl: '#zip',
          isLossless: true,
        },
      ];

      for (const item of items) {
        formats.push({
          id: item.id,
          type: 'image',
          label: item.label || `Photo ${item.id.split('-').pop()}`,
          quality: 'Master Asset',
          extension: 'JPG',
          size: item.size || 'Direct Stream',
          downloadUrl: item.url,
          isLossless: true,
        });
      }

      const authorName = ogDetails.author || 'Facebook Creator';
      const title =
        ogDetails.cleanTitle ||
        og.description ||
        photoCandidates[0]?.caption ||
        `Facebook Photo Album (${items.length} Photos)`;

      return {
        id: `fb-${cleanId}`,
        originalUrl: canonicalUrl,
        platform: 'facebook',
        title,
        description: og.description || photoCandidates[0]?.caption,
        author: {
          name: authorName,
          handle: `@${authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '')}`,
        },
        thumbnail: items[0].thumbnail || items[0].url,
        extractedAt: new Date().toISOString(),
        formats,
        items,
        isCollection: true,
        itemCount: items.length,
        stats: {
          views: ogDetails.views,
          likes: ogDetails.likes,
        },
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. VIDEO OR REEL EXTRACTION
  // ─────────────────────────────────────────────────────────────
  if (
    contentType === 'video' ||
    contentType === 'reel' ||
    semanticHits.videoDeliveryLegacyFields?.length > 0 ||
    og.video
  ) {
    let hdUrl: string | undefined;
    let sdUrl: string | undefined;
    let dashXml: string | undefined;

    // Search videoDeliveryLegacyFields hits
    for (const rawField of semanticHits.videoDeliveryLegacyFields) {
      const field = rawField as {
        browser_native_hd_url?: string;
        browser_native_sd_url?: string;
        dash_manifest_xml_string?: string;
      };
      if (field.browser_native_hd_url && !hdUrl) {
        hdUrl = field.browser_native_hd_url.replace(/\\\//g, '/').replace(/&amp;/g, '&');
      }
      if (field.browser_native_sd_url && !sdUrl) {
        sdUrl = field.browser_native_sd_url.replace(/\\\//g, '/').replace(/&amp;/g, '&');
      }
      if (field.dash_manifest_xml_string && !dashXml) {
        dashXml = field.dash_manifest_xml_string;
      }
    }

    // Fallback: OpenGraph video tag
    if (!hdUrl && !sdUrl && og.video) {
      hdUrl = og.video;
    }

    if (hdUrl || sdUrl) {
      const formats: MediaFormat[] = [];

      // HD Video Stream
      if (hdUrl) {
        const hdBytes = await getRealContentLength(hdUrl);
        formats.push({
          id: `fb-video-hd-${cleanId}`,
          type: 'video',
          label: 'Master Video (HD)',
          quality: 'HD Progressive MP4',
          extension: 'MP4',
          size: formatBytes(hdBytes),
          downloadUrl: hdUrl,
          isLossless: true,
        });
      }

      // SD Video Stream
      if (sdUrl && sdUrl !== hdUrl) {
        const sdBytes = await getRealContentLength(sdUrl);
        formats.push({
          id: `fb-video-sd-${cleanId}`,
          type: 'video',
          label: 'Standard Video (SD)',
          quality: 'SD Progressive MP4',
          extension: 'MP4',
          size: formatBytes(sdBytes),
          downloadUrl: sdUrl,
        });
      }

      // Isolated Soundtrack Audio Stream (from DASH manifest)
      const audioStreamUrl = extractAudioFromDashManifest(dashXml);
      if (audioStreamUrl) {
        const audioBytes = await getRealContentLength(audioStreamUrl);
        formats.push({
          id: `fb-audio-${cleanId}`,
          type: 'audio',
          label: 'Isolated Soundtrack',
          quality: 'Master M4A Audio',
          extension: 'M4A',
          size: formatBytes(audioBytes),
          downloadUrl: audioStreamUrl,
        });
      }

      // Resolve author name & duration
      let authorName = ogDetails.author;
      if (!authorName && semanticHits.media?.length > 0) {
        const mediaObj = semanticHits.media[0] as { owner?: { name?: string } };
        if (mediaObj.owner?.name) authorName = mediaObj.owner.name;
      }
      if (!authorName) authorName = 'Facebook Creator';

      let durationSeconds: number | undefined;
      if (semanticHits.media?.length > 0) {
        const mediaObj = semanticHits.media[0] as { playable_duration_in_ms?: number };
        if (mediaObj.playable_duration_in_ms) {
          durationSeconds = Math.round(mediaObj.playable_duration_in_ms / 1000);
        }
      }

      const title = ogDetails.cleanTitle || og.description || (contentType === 'reel' ? 'Facebook Reel' : 'Facebook Video');
      const thumbnail = og.image || '';

      return {
        id: `fb-${cleanId}`,
        originalUrl: canonicalUrl,
        platform: 'facebook',
        title,
        description: og.description,
        author: {
          name: authorName,
          handle: `@${authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '')}`,
        },
        thumbnail,
        duration: durationSeconds ? formatDuration(durationSeconds) : undefined,
        extractedAt: new Date().toISOString(),
        formats,
        isCollection: false,
        stats: {
          views: ogDetails.views,
          likes: ogDetails.likes,
        },
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SINGLE PHOTO OR GROUP POST PHOTO EXTRACTION
  // ─────────────────────────────────────────────────────────────
  let rawPhotoUri: string | undefined;
  let photoWidth = 2048;
  let photoHeight = 1365;
  let photoCaption: string | undefined;
  let photoAuthor: string | undefined;

  // First check any single photo candidate discovered
  if (photoCandidates.length > 0) {
    rawPhotoUri = photoCandidates[0].uri;
    photoWidth = photoCandidates[0].width;
    photoHeight = photoCandidates[0].height;
    photoCaption = photoCandidates[0].caption;
  }

  // Try currMedia from parsed JSON
  if (!rawPhotoUri && semanticHits.currMedia?.length > 0) {
    const curr = semanticHits.currMedia[0] as {
      image?: { uri?: string; width?: number; height?: number };
      photo_image?: { uri?: string; width?: number; height?: number };
      viewer_image?: { uri?: string; width?: number; height?: number };
      accessibility_caption?: string;
      creation_story?: {
        message?: { text?: string };
        actors?: Array<{ name?: string }>;
      };
    };

    const imgObj = curr.image || curr.photo_image || curr.viewer_image;
    if (imgObj?.uri) {
      rawPhotoUri = imgObj.uri;
      if (imgObj.width) photoWidth = imgObj.width;
      if (imgObj.height) photoHeight = imgObj.height;
    }
    photoCaption = curr.accessibility_caption || curr.creation_story?.message?.text;
    photoAuthor = curr.creation_story?.actors?.[0]?.name;
  }

  // Fallback to og:image
  if (!rawPhotoUri && og.image) {
    rawPhotoUri = og.image;
  }

  if (rawPhotoUri) {
    const masterUri = stripImageSizingParams(rawPhotoUri);
    const imageBytes = await getRealContentLength(masterUri);
    const authorName = photoAuthor || ogDetails.author || 'Facebook Creator';
    const title = photoCaption || ogDetails.cleanTitle || og.description || 'Facebook Photo';

    return {
      id: `fb-${cleanId}`,
      originalUrl: canonicalUrl,
      platform: 'facebook',
      title,
      description: og.description || photoCaption,
      author: {
        name: authorName,
        handle: `@${authorName.toLowerCase().replace(/[^a-z0-9_.]/g, '')}`,
      },
      thumbnail: masterUri,
      dimensions: `${photoWidth}x${photoHeight}`,
      extractedAt: new Date().toISOString(),
      formats: [
        {
          id: `fb-photo-${cleanId}`,
          type: 'image',
          label: 'Master Photo',
          quality: `${photoWidth}x${photoHeight} Source Asset`,
          extension: 'JPG',
          size: formatBytes(imageBytes),
          downloadUrl: masterUri,
          isLossless: true,
        },
      ],
      isCollection: false,
      stats: {
        views: ogDetails.views,
        likes: ogDetails.likes,
      },
    };
  }

  // If no formats could be resolved
  throw new ExtractionPipelineError(
    'EXTRACTION_FAILED',
    'Could not extract media assets from this Facebook page. The post may be restricted or formatted unsupported.',
    {
      technicalDetail: `Content type resolved as ${contentType}, but no valid media streams discovered. Final URL: ${finalUrl}`,
      platform: 'facebook',
      statusHint: 422,
    }
  );
}
