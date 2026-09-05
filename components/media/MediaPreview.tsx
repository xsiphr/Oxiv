'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { MediaResult, MediaFormat, MediaItem } from '@/types';
import {
  Download,
  RefreshCw,
  Eye,
  Heart,
  Layers,
  Film,
  Music,
  Image as ImageIcon,
  Archive,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { SiTiktok, SiInstagram, SiFacebook, SiPinterest, SiX } from 'react-icons/si';
import { useI18n } from '@/lib/i18n';
import { downloadZipBundle, ZipBundleItem } from '@/lib/zip';
import { CardDownloadState } from '@/types';
import { Oxi } from '@/components/ui/Oxi';

interface MediaPreviewProps {
  media: MediaResult;
  onReset: () => void;
}

export function MediaPreview({ media, onReset }: MediaPreviewProps) {
  const { t, locale } = useI18n();
  // Per-card isolated download state map: cardId -> { status, progress, error }
  const [cardStates, setCardStates] = useState<Record<string, CardDownloadState>>({});
  const [packagedZipSize, setPackagedZipSize] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Multi-photo selection modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotoIndices, setSelectedPhotoIndices] = useState<Set<number>>(new Set());

  // Quality selection state for multi-quality video ZIP bundling ('hd' | 'sd' | 'everything')
  const [videoZipQuality, setVideoZipQuality] = useState<'hd' | 'sd' | 'everything'>('hd');

  const isCollection = Boolean(media.isCollection && media.items && media.items.length > 1);
  const activeItem: MediaItem | null =
    isCollection && media.items ? media.items[activeSlideIndex] || media.items[0] : null;

  // Reset states if media result changes
  useEffect(() => {
    setPackagedZipSize(null);
    setCardStates({});
    setActiveSlideIndex(0);
    setIsPhotoModalOpen(false);
    setVideoZipQuality('hd');
    if (media.items) {
      setSelectedPhotoIndices(new Set(media.items.map((_, i) => i)));
    }
  }, [media.id, media.items]);

  const handlePrevSlide = useCallback(() => {
    if (!media.items) return;
    setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : media.items!.length - 1));
  }, [media.items]);

  const handleNextSlide = useCallback(() => {
    if (!media.items) return;
    setActiveSlideIndex((prev) => (prev < media.items!.length - 1 ? prev + 1 : 0));
  }, [media.items]);

  // Keyboard navigation: ArrowLeft and ArrowRight for album slideshows
  useEffect(() => {
    if (!isCollection || !media.items || media.items.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isPhotoModalOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollection, media.items, isPhotoModalOpen, handlePrevSlide, handleNextSlide]);

  // Lock body scroll and handle Escape key when photo modal is open
  useEffect(() => {
    if (!isPhotoModalOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsPhotoModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isPhotoModalOpen]);

  // Reusable ZIP download handler via client-side downloadZipBundle utility
  const executeZipDownload = async (
    items: ZipBundleItem[],
    filename: string,
    buttonId: string
  ) => {
    setCardStates((prev) => ({
      ...prev,
      [buttonId]: { status: 'loading' },
    }));

    try {
      const result = await downloadZipBundle({
        items,
        filename,
        locale,
        onProgress: (progress) => {
          setCardStates((prev) => ({
            ...prev,
            [buttonId]: {
              status: 'loading',
              progress,
            },
          }));
        },
      });

      setPackagedZipSize(result.formattedSize);
      setCardStates((prev) => ({
        ...prev,
        [buttonId]: { status: 'saved' },
      }));

      setTimeout(() => {
        setCardStates((prev) => {
          if (prev[buttonId]?.status === 'saved') {
            const next = { ...prev };
            delete next[buttonId];
            return next;
          }
          return prev;
        });
      }, 3000);
    } catch (err) {
      console.error(`ZIP download error for ${buttonId}:`, err);
      setCardStates((prev) => ({
        ...prev,
        [buttonId]: {
          status: 'error',
          error: err instanceof Error ? err.message : 'ZIP download failed',
        },
      }));

      setTimeout(() => {
        setCardStates((prev) => {
          if (prev[buttonId]?.status === 'error') {
            const next = { ...prev };
            delete next[buttonId];
            return next;
          }
          return prev;
        });
      }, 3000);
    }
  };

  // Single file download handler
  const executeSingleDownload = (
    url: string,
    filename: string,
    buttonId?: string
  ) => {
    if (buttonId) {
      setCardStates((prev) => ({
        ...prev,
        [buttonId]: { status: 'loading' },
      }));
    }

    const downloadEndpoint = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

    setTimeout(() => {
      const anchor = document.createElement('a');
      anchor.href = downloadEndpoint;
      anchor.target = '_blank';
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      if (buttonId) {
        setCardStates((prev) => ({
          ...prev,
          [buttonId]: { status: 'saved' },
        }));

        setTimeout(() => {
          setCardStates((prev) => {
            if (prev[buttonId]?.status === 'saved') {
              const next = { ...prev };
              delete next[buttonId];
              return next;
            }
            return prev;
          });
        }, 2500);
      }
    }, 300);
  };

  // Toggle single photo selection in modal
  const handleTogglePhoto = (index: number) => {
    setSelectedPhotoIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Select all or clear all
  const handleToggleSelectAll = () => {
    if (!media.items) return;
    if (selectedPhotoIndices.size === media.items.length) {
      setSelectedPhotoIndices(new Set());
    } else {
      setSelectedPhotoIndices(new Set(media.items.map((_, i) => i)));
    }
  };

  // Handle download of selected photos from modal (individual downloads for all selected items)
  const handleDownloadSelectedPhotos = async () => {
    if (!media.items || selectedPhotoIndices.size === 0) return;

    const selectedList = Array.from(selectedPhotoIndices)
      .sort((a, b) => a - b)
      .map((idx) => ({
        item: media.items![idx],
        originalIndex: idx + 1,
      }));

    const cleanId = media.id.replace(/^[a-z]+-/, '');

    // Individual downloads for all selected items
    setCardStates((prev) => ({
      ...prev,
      'modal-selected': { status: 'loading' },
    }));

    for (let i = 0; i < selectedList.length; i++) {
      const { item, originalIndex } = selectedList[i];
      const filename = `oxiv-${media.platform}-${cleanId}-photo-${String(originalIndex).padStart(2, '0')}.${(item.extension || 'jpg').toLowerCase()}`;
      executeSingleDownload(item.url, filename);
      if (i < selectedList.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    setCardStates((prev) => ({
      ...prev,
      'modal-selected': { status: 'saved' },
    }));

    setTimeout(() => {
      setCardStates((prev) => {
        if (prev['modal-selected']?.status === 'saved') {
          const next = { ...prev };
          delete next['modal-selected'];
          return next;
        }
        return prev;
      });
      setIsPhotoModalOpen(false);
    }, 1200);
  };

  // Full Album ZIP download handler (photos only)
  const handleDownloadFullAlbumZip = () => {
    if (!media.items) return;
    const cleanId = media.id.replace(/^[a-z]+-/, '');
    const filename = `oxiv-${media.platform}-${cleanId}-collection.zip`;
    executeZipDownload(
      media.items.map((it, idx) => ({
        url: it.url,
        filename: `slide-${String(idx + 1).padStart(2, '0')}`,
        kind: 'photo' as const,
        extension: it.extension.toLowerCase(),
      })),
      filename,
      `zip-${media.id}`
    );
  };

  // Everything ZIP download handler for slideshow mode (all photos + isolated soundtrack)
  const handleDownloadEverythingZip = () => {
    if (!media.items) return;
    const cleanId = media.id.replace(/^[a-z]+-/, '');
    const filename = `oxiv-${media.platform}-${cleanId}-everything.zip`;

    const photoItems: ZipBundleItem[] = media.items.map((it, idx) => ({
      url: it.url,
      filename: `slide-${String(idx + 1).padStart(2, '0')}`,
      kind: 'photo',
      extension: it.extension.toLowerCase(),
    }));

    const audioItem: ZipBundleItem[] = audioFormat
      ? [
          {
            url: audioFormat.downloadUrl,
            filename: `soundtrack`,
            kind: 'audio',
            extension: audioFormat.extension.toLowerCase(),
          },
        ]
      : [];

    executeZipDownload([...photoItems, ...audioItem], filename, 'everything-zip');
  };

  // Video Mode: Download All (ZIP) bundling video MP4 + audio MP3 with quality selection
  const handleDownloadVideoBundle = (variant: 'hd' | 'sd' | 'everything' | 'all' = 'all') => {
    const cleanId = media.id.replace(/^[a-z]+-/, '');
    const validFormats = media.formats.filter(
      (f) => f.type !== 'archive' && f.downloadUrl && !f.downloadUrl.startsWith('#')
    );

    let selectedFormats: MediaFormat[] = validFormats;
    let fileSuffix = 'bundle';
    let buttonId = 'video-bundle-zip';

    if (variant === 'hd') {
      const hd = validFormats.find(
        (f) =>
          f.type === 'video' &&
          (f.id.includes('-hd') ||
            f.quality?.toLowerCase().includes('hd') ||
            f.label.toLowerCase().includes('(hd)'))
      );
      const audio = validFormats.filter((f) => f.type === 'audio');
      selectedFormats = [hd, ...audio].filter((f): f is MediaFormat => Boolean(f));
      fileSuffix = 'bundle-hd';
      buttonId = 'video-bundle-hd';
    } else if (variant === 'sd') {
      const sd = validFormats.find(
        (f) =>
          f.type === 'video' &&
          (f.id.includes('-sd') ||
            f.quality?.toLowerCase().includes('sd') ||
            f.label.toLowerCase().includes('(sd)'))
      );
      const audio = validFormats.filter((f) => f.type === 'audio');
      selectedFormats = [sd, ...audio].filter((f): f is MediaFormat => Boolean(f));
      fileSuffix = 'bundle-sd';
      buttonId = 'video-bundle-sd';
    } else if (variant === 'everything') {
      selectedFormats = validFormats;
      fileSuffix = 'bundle-everything';
      buttonId = 'video-bundle-everything';
    }

    const filename = `oxiv-${media.platform}-${cleanId}-${fileSuffix}.zip`;

    const items: ZipBundleItem[] = selectedFormats.map((f, idx) => {
      let suffix: string;
      if (f.type === 'audio') {
        suffix = 'audio-soundtrack';
      } else if (f.type === 'image') {
        suffix = 'image-master';
      } else {
        const isHd =
          f.id.includes('-hd') ||
          f.quality?.toLowerCase().includes('hd') ||
          f.label.toLowerCase().includes('(hd)');
        const isSd =
          f.id.includes('-sd') ||
          f.quality?.toLowerCase().includes('sd') ||
          f.label.toLowerCase().includes('(sd)');
        if (isHd) suffix = 'video-hd';
        else if (isSd) suffix = 'video-sd';
        else suffix = `video-track-${idx + 1}`;
      }
      const kind: ZipBundleItem['kind'] =
        f.type === 'audio' ? 'audio' : f.type === 'image' ? 'photo' : 'video';
      return {
        url: f.downloadUrl,
        filename: `oxiv-${media.platform}-${cleanId}-${suffix}`,
        kind,
        extension: f.extension.toLowerCase(),
      };
    });

    executeZipDownload(items, filename, buttonId);
  };

  // Standard stream download handler with explicit quality naming (HD vs SD)
  const handleDownload = (format: MediaFormat) => {
    if (format.type === 'archive' || format.downloadUrl === '#zip') {
      handleDownloadFullAlbumZip();
      return;
    }

    const cleanId = media.id.replace(/^[a-z]+-/, '');
    let suffix = 'video';
    if (format.type === 'audio') {
      suffix = 'audio';
    } else if (format.type === 'image') {
      suffix = isCollection ? `photo-${activeSlideIndex + 1}` : 'image';
    } else if (format.type === 'video') {
      const isHd =
        format.id.includes('-hd') ||
        format.quality?.toLowerCase().includes('hd') ||
        format.label.toLowerCase().includes('(hd)');
      const isSd =
        format.id.includes('-sd') ||
        format.quality?.toLowerCase().includes('sd') ||
        format.label.toLowerCase().includes('(sd)');
      if (isHd) suffix = 'video-hd';
      else if (isSd) suffix = 'video-sd';
      else suffix = 'video';
    }
    const filename = `oxiv-${media.platform}-${cleanId}-${suffix}.${format.extension.toLowerCase()}`;
    executeSingleDownload(format.downloadUrl, filename, format.id);
  };

  const handleResetClick = () => {
    onReset();
  };

  const getPlatformIcon = () => {
    switch (media.platform) {
      case 'tiktok':
        return <SiTiktok className="w-3.5 h-3.5" />;
      case 'instagram':
        return <SiInstagram className="w-3.5 h-3.5" />;
      case 'facebook':
        return <SiFacebook className="w-3.5 h-3.5" />;
      case 'pinterest':
        return <SiPinterest className="w-3.5 h-3.5" />;
      case 'x':
        return <SiX className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const activeDisplayUrl = activeItem?.url || media.thumbnail;
  const totalSlides = media.items?.length || 1;

  // Streams list for display
  const audioFormat = useMemo(
    () => media.formats.find((f) => f.type === 'audio'),
    [media.formats]
  );

  // Check if video bundle ZIP option is eligible (when multiple formats e.g. video + audio exist)
  const isVideoBundleEligible =
    !isCollection &&
    media.formats.filter((f) => f.type !== 'archive' && f.downloadUrl && !f.downloadUrl.startsWith('#'))
      .length >= 2;

  // Multi-quality video detection (e.g. Facebook HD + SD)
  const videoFormats = useMemo(
    () =>
      media.formats.filter(
        (f) => f.type === 'video' && f.downloadUrl && !f.downloadUrl.startsWith('#')
      ),
    [media.formats]
  );

  const hdVideoFormat = useMemo(
    () =>
      videoFormats.find(
        (f) =>
          f.id.includes('-hd') ||
          f.quality?.toLowerCase().includes('hd') ||
          f.label.toLowerCase().includes('(hd)')
      ),
    [videoFormats]
  );

  const sdVideoFormat = useMemo(
    () =>
      videoFormats.find(
        (f) =>
          f.id.includes('-sd') ||
          f.quality?.toLowerCase().includes('sd') ||
          f.label.toLowerCase().includes('(sd)')
      ),
    [videoFormats]
  );

  const hasMultiQualityVideo = !isCollection && Boolean(hdVideoFormat && sdVideoFormat);

  // Check if photo slideshow has both photos AND an audio track
  const isPhotoEverythingEligible = isCollection && Boolean(audioFormat);

  return (
    <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] transition-colors">
      {/* Top Header Bar inside Preview */}
      <div className="w-full border-b border-dashed border-[var(--colors-hairline)]">
        <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Platform Pill, Oxi Ready Badge & Timestamp */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs capitalize px-2.5 py-1 rounded-full bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] font-semibold">
              {getPlatformIcon()}
              <span>{media.platform}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-ink)]">
              <Oxi status="success" size={13} className="shrink-0" />
              <span className="text-[11px] font-medium tracking-tight text-[var(--colors-body)]">Ready</span>
            </span>

            <span className="font-mono text-xs text-[var(--colors-muted)]">
              {media.extractedAt}
            </span>
          </div>

          {/* Right: New Extract Trigger */}
          <button
            type="button"
            onClick={handleResetClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] hover:bg-[var(--colors-surface-elevated)] text-[var(--colors-body)] hover:text-[var(--colors-ink)] font-mono text-xs transition-all cursor-pointer shadow-xs active:scale-95 outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.preview.newExtract}</span>
          </button>
        </div>
      </div>

      {/* Main Preview Content Body */}
      <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)]">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Visual Display & Meta Info */}
            <div className="lg:col-span-6 space-y-4">
              {/* Primary Media Viewport */}
              <div className="relative aspect-video bg-[var(--colors-surface-elevated)] rounded-xl border border-[var(--colors-hairline)] overflow-hidden shadow-xs group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeDisplayUrl}
                  alt={media.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Slide Counter / Duration Overlay */}
                {isCollection ? (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 font-mono text-xs pointer-events-none">
                    <span className="px-2.5 py-1 rounded-md bg-black/40 border border-white/20 text-white backdrop-blur-md backdrop-saturate-150 font-semibold shadow-lg shadow-black/25">
                      {t.preview.slideOf} {activeSlideIndex + 1} / {totalSlides}
                    </span>
                  </div>
                ) : (
                  media.duration && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 font-mono text-xs pointer-events-none">
                      <span className="px-2.5 py-1 rounded-md bg-black/40 border border-white/20 text-white backdrop-blur-md backdrop-saturate-150 font-semibold shadow-lg shadow-black/25">
                        {media.duration}
                      </span>
                    </div>
                  )
                )}

                {/* Prev / Next Slide Navigators for Carousels */}
                {isCollection && (
                  <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={handlePrevSlide}
                      aria-label="Previous slide"
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-xs pointer-events-auto transition-all cursor-pointer active:scale-95 outline-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSlide}
                      aria-label="Next slide"
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-xs pointer-events-auto transition-all cursor-pointer active:scale-95 outline-none"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Carousel Thumbnail Strip (if multiple items) */}
              {isCollection && media.items && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--colors-muted)]">
                      {t.preview.albumSlides(media.items.length)}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--colors-muted)]">
                      {t.preview.clickToInspect}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {media.items.slice(0, 8).map((item, index) => {
                      const isSelected = index === activeSlideIndex;
                      const isLastSlot = index === 7 && media.items!.length > 8;
                      const remainingCount = media.items!.length - 7;

                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveSlideIndex(index)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveSlideIndex(index);
                            }
                          }}
                          aria-label={`Slide ${index + 1}`}
                          className={`aspect-square-grid-item rounded-lg overflow-hidden border transition-all cursor-pointer select-none outline-none ${
                            isSelected
                              ? 'border-[var(--colors-ink)] ring-2 ring-[var(--colors-ink)]/20'
                              : 'border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] opacity-70 hover:opacity-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumbnail || item.url}
                            alt={`Slide ${index + 1}`}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          />
                          <span className="absolute bottom-1 left-1 z-10 px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-[10px] font-mono text-white backdrop-blur-xs font-medium shadow-xs pointer-events-none">
                            #{index + 1}
                          </span>
                          {isLastSlot && (
                            <div className="absolute inset-0 z-10 bg-black/85 flex items-center justify-center font-mono text-xs font-bold text-white pointer-events-none">
                              +{remainingCount}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Author and Engagement Details */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] flex items-center justify-center font-mono text-xs font-bold text-[var(--colors-ink)] overflow-hidden">
                      {media.author.avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={media.author.avatar}
                          alt={media.author.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        media.author.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-body font-semibold text-xs text-[var(--colors-ink)]">
                        {media.author.name}
                      </h4>
                      <p className="font-mono text-[11px] text-[var(--colors-muted)]">
                        {media.author.handle}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  {media.stats && (
                    <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--colors-muted)]">
                      {media.stats.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {media.stats.views}
                        </span>
                      )}
                      {media.stats.likes && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {media.stats.likes}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Clean Decoded Title & Description */}
                <p className="font-body text-xs sm:text-sm text-[var(--colors-body)] leading-relaxed pt-1 whitespace-pre-line">
                  {media.title || media.description}
                </p>
              </div>
            </div>

            {/* Right Column: Download Formats Breakdown */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--colors-muted)]" />
                  <span className="font-mono text-xs font-semibold text-[var(--colors-ink)] uppercase tracking-wider">
                    {t.preview.availableStreams}
                  </span>
                </div>
              </div>

              {/* List of Formats */}
              <div className="space-y-2.5">
                {isCollection ? (
                  /* ─── PHOTO / SLIDESHOW MODE ─── */
                  <>
                    {/* 1. All Photos (ZIP) Card */}
                    <div className="p-3.5 rounded-xl border bg-[var(--colors-surface-card)] border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs outline-none">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Archive className="w-3.5 h-3.5 text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] transition-colors" />
                          <span className="font-body text-xs sm:text-sm font-semibold text-[var(--colors-ink)]">
                            {t.preview.allPhotos(media.items?.length || 0)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--colors-muted)]">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-body)]">
                            ZIP
                          </span>
                          <span>
                            {packagedZipSize
                              ? `${media.items?.length || 0} Files • ${packagedZipSize}`
                              : `${media.items?.length || 0} Files`}
                          </span>
                          <span>• {t.preview.losslessZipPackage}</span>
                        </div>
                        <p className="font-body text-[11px] text-[var(--colors-muted)] leading-tight pt-0.5">
                          {t.preview.zipHint}
                        </p>
                      </div>

                      {(() => {
                        const cardState = cardStates[`zip-${media.id}`];
                        const isLoading = cardState?.status === 'loading';
                        const isSaved = cardState?.status === 'saved';

                        return (
                          <button
                            type="button"
                            onClick={handleDownloadFullAlbumZip}
                            disabled={isLoading}
                            className="px-3.5 py-1.5 rounded-lg font-body font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75 min-w-[125px] active:scale-95 bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                          >
                            {isLoading ? (
                              <>
                                <span className="inline-block w-3 h-3 border-2 border-[var(--colors-canvas)] border-t-transparent rounded-full animate-spin shrink-0" />
                                <span className="font-mono text-[11px] sm:text-xs">
                                  {cardState?.progress?.displayText || t.preview.packaging}
                                </span>
                              </>
                            ) : isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t.preview.saved}</span>
                              </>
                            ) : (
                              <>
                                <Archive className="w-3.5 h-3.5" />
                                <span>{t.preview.downloadAllZip}</span>
                              </>
                            )}
                          </button>
                        );
                      })()}
                    </div>

                    {/* 2. Single "Select Photos" Picker Card */}
                    <div className="p-3.5 rounded-xl border bg-[var(--colors-surface-card)] border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs outline-none">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-3.5 h-3.5 text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] transition-colors" />
                          <span className="font-body text-xs sm:text-sm font-semibold text-[var(--colors-ink)]">
                            {t.preview.selectPhotos}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--colors-muted)]">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-body)]">
                            {media.items?.length || 0} Photos
                          </span>
                          <span>{t.preview.selectPhotosDesc}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPhotoModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg font-body font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer min-w-[110px] active:scale-95 bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] text-[var(--colors-ink)] hover:bg-[var(--colors-surface-card)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                      >
                        <Layers className="w-3.5 h-3.5 text-[var(--colors-muted)]" />
                        <span>{t.preview.selectBtn}</span>
                      </button>
                    </div>

                    {/* 3. Isolated Soundtrack (if present) */}
                    {audioFormat && (
                      <div className="p-3.5 rounded-xl border bg-[var(--colors-surface-card)] border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs outline-none">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Music className="w-3.5 h-3.5 text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] transition-colors" />
                            <span className="font-body text-xs sm:text-sm font-semibold text-[var(--colors-ink)]">
                              {audioFormat.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--colors-muted)]">
                            <span className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-body)]">
                              {audioFormat.extension}
                            </span>
                            <span>{audioFormat.size}</span>
                            {audioFormat.quality && <span>• {audioFormat.quality}</span>}
                          </div>
                        </div>

                        {(() => {
                          const cardState = cardStates[audioFormat.id];
                          const isLoading = cardState?.status === 'loading';
                          const isSaved = cardState?.status === 'saved';

                          return (
                            <button
                              type="button"
                              onClick={() => handleDownload(audioFormat)}
                              disabled={isLoading}
                              className="px-3.5 py-1.5 rounded-lg font-body font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75 min-w-[110px] active:scale-95 bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                            >
                              {isLoading ? (
                                <>
                                  <span className="inline-block w-3 h-3 border-2 border-[var(--colors-canvas)] border-t-transparent rounded-full animate-spin" />
                                  <span>{t.preview.streaming}</span>
                                </>
                              ) : isSaved ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{t.preview.saved}</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span>{t.preview.download}</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    )}

                    {/* 4. "Everything (ZIP)" Bundle Option (All photos + Soundtrack) */}
                    {isPhotoEverythingEligible && (
                      <>
                        <div className="border-t border-dashed border-[var(--colors-hairline)] my-1" />

                        <div className="p-3.5 rounded-xl border bg-[var(--colors-surface-card)] border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs outline-none">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Archive className="w-3.5 h-3.5 text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] transition-colors" />
                              <span className="font-body text-xs sm:text-sm font-semibold text-[var(--colors-ink)]">
                                {t.preview.everythingZipCard}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--colors-muted)]">
                              <span className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-body)]">
                                ZIP
                              </span>
                              <span>{t.preview.everythingZipDesc}</span>
                            </div>
                            <p className="font-body text-[11px] text-[var(--colors-muted)] leading-tight pt-0.5">
                              {t.preview.zipHint}
                            </p>
                          </div>

                          {(() => {
                            const cardState = cardStates['everything-zip'];
                            const isLoading = cardState?.status === 'loading';
                            const isSaved = cardState?.status === 'saved';

                            return (
                              <button
                                type="button"
                                onClick={handleDownloadEverythingZip}
                                disabled={isLoading}
                                className="px-3.5 py-1.5 rounded-lg font-body font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75 min-w-[125px] active:scale-95 bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                              >
                                {isLoading ? (
                                  <>
                                    <span className="inline-block w-3 h-3 border-2 border-[var(--colors-canvas)] border-t-transparent rounded-full animate-spin shrink-0" />
                                    <span className="font-mono text-[11px] sm:text-xs">
                                      {cardState?.progress?.displayText || t.preview.packaging}
                                    </span>
                                  </>
                                ) : isSaved ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{t.preview.saved}</span>
                                  </>
                                ) : (
                                  <>
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>{t.preview.downloadAllZip}</span>
                                  </>
                                )}
                              </button>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  /* ─── VIDEO / SINGLE STREAM MODE ─── */
                  <>
                    {/* Standard Individual Stream Cards (e.g. Video MP4, Audio MP3) */}
                    {media.formats.map((format) => {
                      const formatCard = cardStates[format.id];
                      const isDownloading = formatCard?.status === 'loading';
                      const isSaved = formatCard?.status === 'saved';

                      const getIcon = () => {
                        if (format.type === 'audio') return <Music className="w-3.5 h-3.5" />;
                        if (format.type === 'image') return <ImageIcon className="w-3.5 h-3.5" />;
                        return <Film className="w-3.5 h-3.5" />;
                      };

                      return (
                        <div
                          key={format.id}
                          className="p-3.5 rounded-xl border bg-[var(--colors-surface-card)] border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs outline-none"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] transition-colors">
                                {getIcon()}
                              </span>
                              <span className="font-body text-xs sm:text-sm font-semibold text-[var(--colors-ink)]">
                                {format.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--colors-muted)]">
                              <span className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-body)]">
                                {format.extension}
                              </span>
                              <span>{format.size}</span>
                              {format.quality && <span>• {format.quality}</span>}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownload(format)}
                            disabled={isDownloading}
                            aria-label={`Download ${format.label}`}
                            className="px-3.5 py-1.5 rounded-lg font-body font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75 min-w-[110px] active:scale-95 bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                          >
                            {isDownloading ? (
                              <>
                                <span className="inline-block w-3 h-3 border-2 border-[var(--colors-canvas)] border-t-transparent rounded-full animate-spin" />
                                <span>{t.preview.streaming}</span>
                              </>
                            ) : isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t.preview.saved}</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>{t.preview.download}</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}

                    {/* Dashed Horizontal Divider + Video ZIP Bundling Cards */}
                    {/* Dashed Horizontal Divider + Video ZIP Bundling Card */}
                    {hasMultiQualityVideo ? (
                      <>
                        <div className="border-t border-dashed border-[var(--colors-hairline)] my-1" />

                        <div className="p-3.5 rounded-xl border bg-[var(--colors-surface-card)] border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs outline-none">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Archive className="w-3.5 h-3.5 text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] transition-colors" />
                              <span className="font-body text-xs sm:text-sm font-semibold text-[var(--colors-ink)]">
                                {t.preview.downloadAllZipCard}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--colors-muted)]">
                              <span className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-body)] font-semibold">
                                ZIP
                              </span>
                              <span>
                                {videoZipQuality === 'hd'
                                  ? t.preview.videoHdZipDesc
                                  : videoZipQuality === 'sd'
                                  ? t.preview.videoSdZipDesc
                                  : t.preview.videoEverythingZipDesc}
                              </span>
                            </div>
                            <p className="font-body text-[11px] text-[var(--colors-muted)] leading-tight pt-0.5">
                              {t.preview.zipHint}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                            {/* Segmented Quality Toggle ("HD" | "SD" | "All") */}
                            <div className="inline-flex items-center p-0.5 rounded-lg bg-[var(--colors-surface-elevated)] border border-dashed border-[var(--colors-hairline)] font-mono text-xs">
                              {(
                                [
                                  { id: 'hd', label: 'HD' },
                                  { id: 'sd', label: 'SD' },
                                  { id: 'everything', label: locale === 'ar' ? 'الكل' : 'All' },
                                ] as const
                              ).map((opt) => {
                                const isActive = videoZipQuality === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setVideoZipQuality(opt.id)}
                                    className={`px-2.5 py-1 rounded-md transition-all text-xs font-semibold cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)] ${
                                      isActive
                                        ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] shadow-xs'
                                        : 'text-[var(--colors-muted)] hover:text-[var(--colors-ink)] hover:bg-[var(--colors-surface-card)]'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Download Action Button */}
                            {(() => {
                              const cardState = cardStates[`video-bundle-${videoZipQuality}`];
                              const isLoading = cardState?.status === 'loading';
                              const isSaved = cardState?.status === 'saved';

                              return (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadVideoBundle(videoZipQuality)}
                                  disabled={isLoading}
                                  className="px-3.5 py-1.5 rounded-lg font-body font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75 min-w-[125px] active:scale-95 bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                                >
                                  {isLoading ? (
                                    <>
                                      <span className="inline-block w-3 h-3 border-2 border-[var(--colors-canvas)] border-t-transparent rounded-full animate-spin shrink-0" />
                                      <span className="font-mono text-[11px] sm:text-xs">
                                        {cardState?.progress?.displayText || t.preview.packaging}
                                      </span>
                                    </>
                                  ) : isSaved ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>{t.preview.saved}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Archive className="w-3.5 h-3.5" />
                                      <span>{t.preview.downloadAllZip}</span>
                                    </>
                                  )}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </>
                    ) : isVideoBundleEligible ? (
                      <>
                        <div className="border-t border-dashed border-[var(--colors-hairline)] my-1" />

                        <div className="p-3.5 rounded-xl border bg-[var(--colors-surface-card)] border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs outline-none">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Archive className="w-3.5 h-3.5 text-[var(--colors-muted)] group-hover:text-[var(--colors-ink)] transition-colors" />
                              <span className="font-body text-xs sm:text-sm font-semibold text-[var(--colors-ink)]">
                                {t.preview.downloadAllZipCard}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--colors-muted)]">
                              <span className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-body)]">
                                ZIP
                              </span>
                              <span>{t.preview.downloadAllZipDesc}</span>
                            </div>
                            <p className="font-body text-[11px] text-[var(--colors-muted)] leading-tight pt-0.5">
                              {t.preview.zipHint}
                            </p>
                          </div>

                          {(() => {
                            const cardState = cardStates['video-bundle-zip'];
                            const isLoading = cardState?.status === 'loading';
                            const isSaved = cardState?.status === 'saved';

                            return (
                              <button
                                type="button"
                                onClick={() => handleDownloadVideoBundle('all')}
                                disabled={isLoading}
                                className="px-3.5 py-1.5 rounded-lg font-body font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75 min-w-[125px] active:scale-95 bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                              >
                                {isLoading ? (
                                  <>
                                    <span className="inline-block w-3 h-3 border-2 border-[var(--colors-canvas)] border-t-transparent rounded-full animate-spin shrink-0" />
                                    <span className="font-mono text-[11px] sm:text-xs">
                                      {cardState?.progress?.displayText || t.preview.packaging}
                                    </span>
                                  </>
                                ) : isSaved ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{t.preview.saved}</span>
                                  </>
                                ) : (
                                  <>
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>{t.preview.downloadAllZip}</span>
                                  </>
                                )}
                              </button>
                            );
                          })()}
                        </div>
                      </>
                    ) : null}
                  </>
                )}
              </div>

              {/* Note box */}
              <div className="p-2.5 rounded-lg border border-dashed border-[var(--colors-hairline)] bg-[var(--colors-surface-elevated)] flex items-start gap-2">
                <span className="font-mono text-[11px] text-[var(--colors-muted)] leading-relaxed">
                  {t.preview.notice}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MULTI-PHOTO SELECTION MODAL ─── */}
      {isPhotoModalOpen && media.items && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 bg-black/80 backdrop-blur-xs overscroll-contain animate-fadeIn">
          {/* Modal Card Backdrop Dismiss Area */}
          <div
            className="fixed inset-0"
            onClick={() => setIsPhotoModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Content Card with Fixed Header/Footer and Scrollable Grid */}
          <div className="relative z-10 w-full max-w-2xl max-h-[88vh] flex flex-col rounded-xl bg-[var(--colors-surface-card)] border border-[var(--colors-hairline)] shadow-2xl overflow-hidden text-start">
            {/* Modal Header (Fixed) */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-dashed border-[var(--colors-hairline)] bg-[var(--colors-surface-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <h3 className="font-display font-bold text-base sm:text-lg text-[var(--colors-ink)] truncate">
                    {t.preview.modalTitle}
                  </h3>
                  <p className="font-mono text-xs text-[var(--colors-muted)]">
                    {t.preview.modalSelectedCount(
                      selectedPhotoIndices.size,
                      media.items.length
                    )}
                  </p>
                </div>

                {/* Close button on mobile */}
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  aria-label="Close modal"
                  className="sm:hidden p-1.5 rounded-lg border border-[var(--colors-hairline)] hover:bg-[var(--colors-surface-card)] text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-pointer outline-none shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                {/* Select All / Deselect All Toggle */}
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="px-2.5 py-1 rounded-lg border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] hover:bg-[var(--colors-surface-elevated)] text-[var(--colors-ink)] font-mono text-xs transition-all cursor-pointer shadow-xs active:scale-95 outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                >
                  {selectedPhotoIndices.size === media.items.length
                    ? t.preview.modalDeselectAll
                    : t.preview.modalSelectAll}
                </button>

                {/* Close Button on Desktop */}
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  aria-label="Close modal"
                  className="hidden sm:inline-flex p-1.5 rounded-lg border border-[var(--colors-hairline)] hover:bg-[var(--colors-surface-card)] text-[var(--colors-muted)] hover:text-[var(--colors-ink)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Thumbnails Container separated from Grid */}
            <div className="p-3.5 sm:p-5 overflow-y-auto max-h-[360px] sm:max-h-[320px] md:max-h-[290px] overscroll-contain">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5 w-full">
                {media.items.map((item, index) => {
                  const isSelected = selectedPhotoIndices.has(index);

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleTogglePhoto(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTogglePhoto(index);
                        }
                      }}
                      aria-label={`Toggle photo ${index + 1}`}
                      aria-pressed={isSelected}
                      className={`aspect-square-grid-item rounded-lg overflow-hidden border transition-all cursor-pointer select-none outline-none group ${
                        isSelected
                          ? 'border-[var(--colors-ink)] ring-2 ring-[var(--colors-ink)]/20 opacity-100'
                          : 'border-[var(--colors-hairline)] opacity-60 hover:opacity-95 hover:border-[var(--colors-hairline-strong)]'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnail || item.url}
                        alt={`Photo ${index + 1}`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 pointer-events-none"
                      />

                      {/* Slide Index Badge */}
                      <span className="absolute bottom-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-[10px] font-mono text-white backdrop-blur-xs font-semibold shadow-xs pointer-events-none">
                        #{index + 1}
                      </span>

                      {/* Monochrome Selection Checkmark Badge */}
                      <div
                        className={`absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all pointer-events-none ${
                          isSelected
                            ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] shadow-sm'
                            : 'bg-black/50 border border-white/30 text-transparent opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer (Fixed) */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-surface-elevated)] flex items-center justify-between gap-3 shrink-0">
              <span className="font-mono text-xs text-[var(--colors-muted)]">
                {selectedPhotoIndices.size} / {media.items.length}
              </span>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg font-body font-semibold text-xs transition-all shadow-xs cursor-pointer border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] hover:bg-[var(--colors-surface-elevated)] text-[var(--colors-body)] hover:text-[var(--colors-ink)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                >
                  {t.preview.modalClose}
                </button>

                {(() => {
                  const cardState = cardStates['modal-selected'];
                  const isLoading = cardState?.status === 'loading';
                  const isSaved = cardState?.status === 'saved';

                  return (
                    <button
                      type="button"
                      onClick={handleDownloadSelectedPhotos}
                      disabled={selectedPhotoIndices.size === 0 || isLoading}
                      className="px-4 py-2 rounded-lg font-body font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-95 bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90 outline-none focus-visible:ring-1 focus-visible:ring-[var(--colors-ink)]"
                    >
                      {isLoading ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-[var(--colors-canvas)] border-t-transparent rounded-full animate-spin" />
                          <span>{t.preview.streaming}</span>
                        </>
                      ) : isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.preview.saved}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>
                            {t.preview.modalDownloadSelected(selectedPhotoIndices.size)}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
