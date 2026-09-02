import { NextRequest, NextResponse } from 'next/server';
import { lookupPlatform, LookupResult } from '@/lib/platformRegistry';
import { extractTikTok } from '@/lib/extractors/tiktok';
import { extractPinterest } from '@/lib/extractors/pinterest';
import { ExtractionPipelineError } from '@/lib/extractors/errors';
import { ApiResponse, MediaResult } from '@/types';

export const dynamic = 'force-dynamic';

async function handleExtraction(url: string, lookup: LookupResult): Promise<NextResponse<ApiResponse>> {
  // Tier 3: Invalid URL or completely unrecognized domain
  if (lookup.status === 'invalid' || lookup.status === 'no-match') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: "This doesn't look like a valid link. Check the URL and try again.",
          technicalDetail: lookup.rawHostname ? `Unrecognized domain: ${lookup.rawHostname}` : undefined,
          statusHint: 400,
        },
      },
      { status: 400 }
    );
  }

  // Tier 2B: Recognized platform with NO immediate support roadmap (YouTube, Reddit, etc.)
  if (lookup.status === 'unsupported' && lookup.platform) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Oxiv doesn't support ${lookup.platform.name} links.`,
          platform: lookup.platform.id,
          platformName: lookup.platform.name,
          statusHint: 400,
        },
      },
      { status: 400 }
    );
  }

  // Tier 2A: Planned platforms under active deployment (Instagram, Facebook, X) -> HTTP 503
  if ((lookup.status === 'planned' || lookup.status === 'next') && lookup.platform) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PIPELINE_PENDING',
          message: `${lookup.platform.name} support is in active deployment.`,
          technicalDetail: `Live extraction is operational for TikTok and Pinterest. ${lookup.platform.name} pipeline is queued.`,
          platform: lookup.platform.id,
          platformName: lookup.platform.name,
          statusHint: 503,
        },
      },
      { status: 503 }
    );
  }

  // Tier 1: Live Supported Platforms (TikTok, Pinterest)
  if (lookup.status === 'live' && lookup.platform) {
    try {
      let mediaResult: MediaResult;
      if (lookup.platform.id === 'tiktok') {
        mediaResult = await extractTikTok(url);
      } else if (lookup.platform.id === 'pinterest') {
        mediaResult = await extractPinterest(url);
      } else {
        throw new Error(`Unsupported live platform: ${lookup.platform.id}`);
      }

      return NextResponse.json({
        success: true,
        data: mediaResult,
      });
    } catch (error: unknown) {
      if (error instanceof ExtractionPipelineError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              technicalDetail: error.technicalDetail,
              platform: error.platform,
              statusHint: error.statusHint,
            },
          },
          { status: error.statusHint }
        );
      }

      const errorMessage = error instanceof Error ? error.message : 'Internal extraction pipeline error.';
      console.error('API /api/extract Unhandled Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: errorMessage,
            statusHint: 500,
          },
        },
        { status: 500 }
      );
    }
  }

  // Fallback if any unmapped condition
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INVALID_URL',
        message: "This doesn't look like a valid link. Check the URL and try again.",
        statusHint: 400,
      },
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    let body: { url?: string } | null = null;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: "This doesn't look like a valid link. Check the URL and try again.",
            statusHint: 400,
          },
        },
        { status: 400 }
      );
    }

    const url = body?.url;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: "This doesn't look like a valid link. Check the URL and try again.",
            statusHint: 400,
          },
        },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    const lookup = lookupPlatform(trimmedUrl);
    return handleExtraction(trimmedUrl, lookup);
  } catch (error: unknown) {
    console.error('API /api/extract POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXTRACTION_FAILED',
          message: 'Internal server error processing request.',
          statusHint: 500,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({
      status: 'active',
      service: 'Oxiv Media Extraction Engine',
      supportedLive: ['tiktok', 'pinterest'],
      pipelinePending: ['instagram', 'facebook', 'x', 'youtube'],
      usage: 'POST /api/extract with { url } or GET /api/extract?url=...',
    });
  }

  const lookup = lookupPlatform(url);
  return handleExtraction(url, lookup);
}
