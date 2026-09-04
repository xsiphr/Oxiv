import { zipSync, Zippable } from 'fflate';
import { formatBytes } from '@/lib/extractors/utils';
import { ZipProgressState } from '@/types';

export interface ZipBundleItem {
  url: string;
  filename: string;
  kind?: 'video' | 'audio' | 'photo' | 'file';
  extension?: string;
}

export interface DownloadZipBundleOptions {
  items: ZipBundleItem[];
  filename: string;
  locale?: 'en' | 'ar';
  onProgress?: (progress: ZipProgressState) => void;
}

/**
 * Formats user-facing progress text adhering to Oxiv's staged and byte-level specifications.
 */
export function formatZipProgressText({
  stage,
  itemIndex,
  totalItems,
  itemKind,
  currentBytes,
  totalBytes,
  percent,
  locale = 'en',
}: {
  stage: ZipProgressState['stage'];
  itemIndex: number;
  totalItems: number;
  itemKind: ZipProgressState['itemKind'];
  currentBytes?: number;
  totalBytes?: number;
  percent?: number;
  locale?: 'en' | 'ar';
}): string {
  const isAr = locale === 'ar';

  if (stage === 'compressing') {
    return isAr ? 'ضغط الملفات...' : 'Compressing files…';
  }

  if (stage === 'saving') {
    return isAr ? 'حفظ...' : 'Saving…';
  }

  if (stage === 'done') {
    return isAr ? 'تم الحفظ' : 'Saved';
  }

  // Stage: fetching
  const hasByteProgress =
    typeof percent === 'number' &&
    typeof currentBytes === 'number' &&
    typeof totalBytes === 'number' &&
    totalBytes > 0;

  if (isAr) {
    if (itemKind === 'video') {
      return hasByteProgress
        ? `جلب الفيديو... ${percent}% (${formatBytes(currentBytes)} / ${formatBytes(totalBytes)})`
        : `جلب الفيديو... (${itemIndex}/${totalItems})`;
    }
    if (itemKind === 'audio') {
      return hasByteProgress
        ? `جلب الصوت... ${percent}% (${formatBytes(currentBytes)} / ${formatBytes(totalBytes)})`
        : `جلب الصوت... (${itemIndex}/${totalItems})`;
    }
    if (itemKind === 'photo') {
      return hasByteProgress
        ? `جلب الصورة ${itemIndex}/${totalItems}... ${percent}% (${formatBytes(currentBytes)} / ${formatBytes(totalBytes)})`
        : `جلب الصورة ${itemIndex}/${totalItems}...`;
    }
    return hasByteProgress
      ? `جلب الملف ${itemIndex}/${totalItems}... ${percent}% (${formatBytes(currentBytes)} / ${formatBytes(totalBytes)})`
      : `جلب الملف ${itemIndex}/${totalItems}...`;
  }

  // Default: English
  if (itemKind === 'video') {
    return hasByteProgress
      ? `Fetching video... ${percent}% (${formatBytes(currentBytes)} / ${formatBytes(totalBytes)})`
      : `Fetching video... (${itemIndex}/${totalItems})`;
  }

  if (itemKind === 'audio') {
    return hasByteProgress
      ? `Fetching audio... ${percent}% (${formatBytes(currentBytes)} / ${formatBytes(totalBytes)})`
      : `Fetching audio... (${itemIndex}/${totalItems})`;
  }

  if (itemKind === 'photo') {
    return hasByteProgress
      ? `Fetching photo ${itemIndex}/${totalItems}... ${percent}% (${formatBytes(currentBytes)} / ${formatBytes(totalBytes)})`
      : `Fetching photo ${itemIndex}/${totalItems}...`;
  }

  return hasByteProgress
    ? `Fetching file ${itemIndex}/${totalItems}... ${percent}% (${formatBytes(currentBytes)} / ${formatBytes(totalBytes)})`
    : `Fetching file ${itemIndex}/${totalItems}...`;
}

/**
 * Executes a client-side ZIP aggregation with staged & byte-level progress reporting.
 * Streams each item through /api/download, bundles client-side via fflate, and saves cleanly.
 */
export async function downloadZipBundle({
  items,
  filename,
  locale = 'en',
  onProgress,
}: DownloadZipBundleOptions): Promise<{ size: number; formattedSize: string }> {
  if (!items || items.length === 0) {
    throw new Error('No items specified for ZIP bundle.');
  }

  const zippable: Zippable = {};
  const totalItems = items.length;

  const emitProgress = (
    stage: ZipProgressState['stage'],
    itemIndex: number,
    itemKind: ZipProgressState['itemKind'],
    currentBytes?: number,
    totalBytes?: number,
    percent?: number
  ) => {
    if (!onProgress) return;
    const displayText = formatZipProgressText({
      stage,
      itemIndex,
      totalItems,
      itemKind,
      currentBytes,
      totalBytes,
      percent,
      locale,
    });
    onProgress({
      stage,
      itemIndex,
      totalItems,
      itemKind,
      currentBytes,
      totalBytes,
      percent,
      displayText,
    });
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemIndex = i + 1;

    // Detect item kind
    let itemKind: ZipProgressState['itemKind'] = item.kind || 'file';
    if (!item.kind) {
      const lowerUrl = item.url.toLowerCase();
      const lowerName = item.filename.toLowerCase();
      if (lowerUrl.includes('.mp4') || lowerName.includes('video') || lowerName.endsWith('.mp4')) {
        itemKind = 'video';
      } else if (lowerUrl.includes('.mp3') || lowerName.includes('soundtrack') || lowerName.includes('audio') || lowerName.endsWith('.mp3')) {
        itemKind = 'audio';
      } else if (lowerUrl.includes('.jpg') || lowerUrl.includes('.png') || lowerUrl.includes('.webp') || lowerName.includes('photo') || lowerName.includes('slide')) {
        itemKind = 'photo';
      }
    }

    // Emit initial fetch stage for this item
    emitProgress('fetching', itemIndex, itemKind);

    const downloadEndpoint = `/api/download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(item.filename)}`;
    const res = await fetch(downloadEndpoint);

    if (!res.ok || !res.body) {
      throw new Error(`Failed to fetch stream: ${item.filename} (status ${res.status})`);
    }

    // Check for Content-Length
    const contentLengthHeader = res.headers.get('content-length');
    let totalBytes: number | undefined;
    if (contentLengthHeader) {
      const parsed = parseInt(contentLengthHeader, 10);
      if (!isNaN(parsed) && parsed > 0) {
        totalBytes = parsed;
      }
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    let lastEmitTime = performance.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;

        const now = performance.now();
        // Throttle progress emissions to ~60ms for smooth 60fps UI updates
        const validTotalBytes = typeof totalBytes === 'number' && totalBytes > 0 ? totalBytes : undefined;
        if (now - lastEmitTime >= 60 || (validTotalBytes !== undefined && receivedBytes >= validTotalBytes)) {
          lastEmitTime = now;
          const percent = validTotalBytes !== undefined
            ? Math.min(99, Math.round((receivedBytes / validTotalBytes) * 100))
            : undefined;

          emitProgress('fetching', itemIndex, itemKind, receivedBytes, validTotalBytes, percent);
        }
      }
    }

    // Assemble file chunks into a single Uint8Array
    const fileBuffer = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      fileBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Ensure extension on entry name
    let entryName = item.filename;
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(entryName);
    if (!hasExtension && item.extension) {
      entryName = `${entryName}.${item.extension.replace(/^\./, '')}`;
    }

    zippable[entryName] = fileBuffer;
  }

  // ─── Stage: Compressing ───
  emitProgress('compressing', totalItems, 'file');
  // Small tick to allow React & browser to render the "Compressing files..." label
  await new Promise((resolve) => setTimeout(resolve, 60));

  // Level 0: Store mode (instantaneous, lossless for media streams)
  const zipBuffer = zipSync(zippable, { level: 0 });
  const totalZipBytes = zipBuffer.byteLength;
  const formattedSize = formatBytes(totalZipBytes);

  // ─── Stage: Saving ───
  emitProgress('saving', totalItems, 'file');
  await new Promise((resolve) => setTimeout(resolve, 60));

  const blob = new Blob([zipBuffer], { type: 'application/zip' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  const finalFilename = filename.endsWith('.zip') ? filename : `${filename}.zip`;
  anchor.download = finalFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);

  // ─── Stage: Done ───
  emitProgress('done', totalItems, 'file');

  return {
    size: totalZipBytes,
    formattedSize,
  };
}
