import { ExtractionErrorCode, Platform } from '@/types';

export interface ExtractionPipelineErrorOptions {
  technicalDetail?: string;
  platform?: Platform;
  statusHint?: number;
}

export class ExtractionPipelineError extends Error {
  public readonly code: ExtractionErrorCode;
  public readonly technicalDetail?: string;
  public readonly platform?: Platform;
  public readonly statusHint: number;

  constructor(
    code: ExtractionErrorCode,
    message: string,
    options?: ExtractionPipelineErrorOptions
  ) {
    super(message);
    this.name = 'ExtractionPipelineError';
    this.code = code;
    this.technicalDetail = options?.technicalDetail;
    this.platform = options?.platform;
    this.statusHint = options?.statusHint ?? (code === 'PIPELINE_PENDING' ? 503 : code === 'INVALID_URL' ? 400 : 422);

    // Ensure proper prototype chain inheritance in transpiled environments
    Object.setPrototypeOf(this, ExtractionPipelineError.prototype);
  }
}
