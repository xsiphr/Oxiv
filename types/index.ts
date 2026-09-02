export type Platform = 'tiktok' | 'instagram' | 'pinterest' | 'x' | 'facebook' | 'youtube' | 'unknown';

export interface MediaFormat {
  id: string;
  type: 'video' | 'audio' | 'image' | 'archive';
  label: string;
  resolution?: string;
  quality?: string;
  extension: string;
  size: string;
  downloadUrl: string;
  isLossless?: boolean;
}

export interface MediaAuthor {
  name: string;
  handle: string;
  avatar?: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
  resolution?: string;
  extension: string;
  size?: string;
  label?: string;
}

export interface MediaResult {
  id: string;
  originalUrl: string;
  platform: Platform;
  title: string;
  description?: string;
  author: MediaAuthor;
  thumbnail: string;
  duration?: string;
  dimensions?: string;
  extractedAt: string;
  formats: MediaFormat[];
  items?: MediaItem[];
  isCollection?: boolean;
  itemCount?: number;
  stats?: {
    views?: string;
    likes?: string;
    shares?: string;
  };
}

export type ExtractionStatus = 'idle' | 'extracting' | 'success' | 'error';

export interface RecentExtraction {
  id: string;
  url: string;
  title: string;
  platform: Platform;
  timestamp: number;
}

// ─── Error Codes & Envelopes ───
export type ExtractionErrorCode =
  | 'INVALID_URL'              // Malformed or empty input string
  | 'UNSUPPORTED_PLATFORM'     // Domain not supported
  | 'PIPELINE_PENDING'         // Recognized platform, extractor under active deployment
  | 'MEDIA_UNREACHABLE'        // Private, deleted, geo-blocked, or login-walled
  | 'GATEWAY_TIMEOUT'          // Upstream CDN or API connection timeout
  | 'RATE_LIMITED'             // Upstream 429 Too Many Requests
  | 'EXTRACTION_FAILED';       // General extractor exception

export interface ExtractionError {
  code: ExtractionErrorCode;
  message: string;
  technicalDetail?: string;
  platform?: Platform | string;
  platformName?: string;
  statusHint?: number;
}

export interface ApiSuccessResponse {
  success: true;
  data: MediaResult;
}

export interface ApiErrorResponse {
  success: false;
  error: ExtractionError;
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;
