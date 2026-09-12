import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchMediaStream(targetUrl: string): Promise<Response | null> {
  // Attempt 1: Direct browser fetch without custom referer
  try {
    const res1 = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    if (res1.ok && res1.body) return res1;
  } catch {}

  // Attempt 2: With Pinterest/TikTok referer
  try {
    let referer = 'https://www.tiktok.com/';
    if (targetUrl.includes('pinterest.com') || targetUrl.includes('pinimg.com')) {
      referer = 'https://www.pinterest.com/';
    } else if (targetUrl.includes('facebook.com') || targetUrl.includes('fbcdn.net')) {
      referer = 'https://www.facebook.com/';
    } else if (targetUrl.includes('twimg.com') || targetUrl.includes('twitter.com') || targetUrl.includes('x.com')) {
      referer = 'https://x.com/';
    }
    const res2 = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: '*/*',
        Referer: referer,
      },
    });
    if (res2.ok && res2.body) return res2;
  } catch {}

  // Attempt 3: If an originals image gave 403, fallback to 736x/564x resolution
  if (targetUrl.includes('i.pinimg.com') && targetUrl.includes('/originals/')) {
    for (const fallbackRes of ['/736x/', '/564x/']) {
      try {
        const fallbackUrl = targetUrl.replace('/originals/', fallbackRes);
        const resFallback = await fetch(fallbackUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: '*/*',
          },
        });
        if (resFallback.ok && resFallback.body) return resFallback;
      } catch {}
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mediaUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'oxiv_media';

  if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.startsWith('http')) {
    return NextResponse.json(
      { success: false, error: 'A valid media URL parameter is required.' },
      { status: 400 }
    );
  }

  try {
    // Fetch direct binary stream from origin CDN with resilient fallback
    const response = await fetchMediaStream(mediaUrl);

    if (!response || !response.ok || !response.body) {
      return NextResponse.json(
        {
          success: false,
          error: "This pin's media link expired or is unavailable from the upstream CDN. Please try extracting the link again.",
        },
        { status: 410 }
      );
    }

    // Determine appropriate Content-Type
    const upstreamContentType = response.headers.get('content-type');
    let contentType = upstreamContentType || 'application/octet-stream';
    if (filename.endsWith('.mp4')) contentType = 'video/mp4';
    else if (filename.endsWith('.mp3')) contentType = 'audio/mpeg';
    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (filename.endsWith('.png')) contentType = 'image/png';
    else if (filename.endsWith('.webp')) contentType = 'image/webp';
    else if (filename.endsWith('.gif')) contentType = 'image/gif';
    else if (filename.endsWith('.zip')) contentType = 'application/zip';

    const contentLength = response.headers.get('content-length');

    // Clean and sanitize filename for Content-Disposition header
    const sanitizedFilename = filename.replace(/[/\\?%*:|"<>]/g, '-');

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${sanitizedFilename}"; filename*=UTF-8''${encodeURIComponent(sanitizedFilename)}`);
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Disposition');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    // Stream chunks directly from CDN to browser client
    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Media stream proxy error';
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

