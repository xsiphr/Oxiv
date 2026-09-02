'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { SiTiktok, SiInstagram, SiFacebook, SiPinterest, SiX } from 'react-icons/si';

import { formatBytes } from '@/lib/extractors/utils';

interface MediaPreviewProps {
  media: MediaResult;
  onReset: () => void;
}

export function MediaPreview({ media, onReset }: MediaPreviewProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [packagedZipSize, setPackagedZipSize] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const isCollection = Boolean(media.isCollection && media.items && media.items.length > 1);
  const activeItem: MediaItem | null = isCollection && media.items ? (media.items[activeSlideIndex] || media.items[0]) : null;

  // Reset packaged zip size if media result changes
  React.useEffect(() => {
    setPackagedZipSize(null);
    setActiveSlideIndex(0);
  }, [media.id]);

  const handlePrevSlide = React.useCallback(() => {
    if (!media.items) return;
    setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : media.items!.length - 1));
  }, [media.items]);

  const handleNextSlide = React.useCallback(() => {
    if (!media.items) return;
    setActiveSlideIndex((prev) => (prev < media.items!.length - 1 ? prev + 1 : 0));
  }, [media.items]);

  // Keyboard navigation: ArrowLeft and ArrowRight for album slideshows
  React.useEffect(() => {
    if (!isCollection || !media.items || media.items.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
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
  }, [isCollection, media.items, handlePrevSlide, handleNextSlide]);

  // Consolidate per-photo stream list into a single dynamic selected photo entry
  const displayedFormats: MediaFormat[] = React.useMemo(() => {
    if (!isCollection || !media.items || media.items.length <= 1) {
      return media.formats;
    }

    const zipSize = packagedZipSize
      ? `${media.items.length} Files • ${packagedZipSize}`
      : `${media.items.length} Files`;

    const zipFormat: MediaFormat = {
      ...(media.formats.find((f) => f.type === 'archive' || f.extension === 'ZIP') || {}),
      id: `zip-${media.id}`,
      type: 'archive',
      label: `All Photos (${media.items.length} Images)`,
      quality: 'Lossless ZIP Package',
      extension: 'ZIP',
      size: zipSize,
      downloadUrl: '#zip',
      isLossless: true,
    };

    const currentItem = media.items[activeSlideIndex] || media.items[0];
    const selectedFormat: MediaFormat = {
      id: `photo-selected-${activeSlideIndex + 1}`,
      type: 'image',
      label: `Download Photo ${activeSlideIndex + 1}`,
      quality: 'Original Master',
      extension: currentItem.extension || 'JPG',
      size: currentItem.size || 'Direct Stream',
      downloadUrl: currentItem.url,
      isLossless: true,
    };

    const audioFormat = media.formats.find((f) => f.type === 'audio');

    return [zipFormat, selectedFormat, ...(audioFormat ? [audioFormat] : [])];
  }, [media, isCollection, activeSlideIndex, packagedZipSize]);

  const handleDownload = async (format: MediaFormat) => {
    setDownloadingId(format.id);

    const cleanId = media.id.replace(/^[a-z]+-/, '');

    // Handle ZIP archive download via POST endpoint
    if (format.type === 'archive' || format.downloadUrl === '#zip') {
      try {
        const filename = `oxiv-${media.platform}-${cleanId}-collection.zip`;

        const response = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'zip',
            filename,
            items: media.items?.map((it, idx) => ({
              url: it.url,
              filename: `slide-${String(idx + 1).padStart(2, '0')}`,
              extension: it.extension.toLowerCase(),
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to assemble ZIP archive.');
        }

        const blob = await response.blob();
        const formattedSize = formatBytes(blob.size);
        setPackagedZipSize(formattedSize);

        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);

        setDownloadingId(null);
        setSavedId(format.id);
        setTimeout(() => setSavedId(null), 3000);
      } catch (err) {
        console.error('ZIP download error:', err);
        setDownloadingId(null);
      }
      return;
    }

    // Single item stream download via GET endpoint
    const suffix =
      format.type === 'audio'
        ? 'audio'
        : format.type === 'image'
        ? (isCollection ? `photo-${activeSlideIndex + 1}` : 'image')
        : 'video';
    const filename = `oxiv-${media.platform}-${cleanId}-${suffix}.${format.extension.toLowerCase()}`;
    const downloadEndpoint = `/api/download?url=${encodeURIComponent(format.downloadUrl)}&filename=${encodeURIComponent(filename)}`;

    try {
      // Brief feedback delay to allow spinner state transition before triggering browser download
      setTimeout(() => {
        const anchor = document.createElement('a');
        anchor.href = downloadEndpoint;
        anchor.target = '_blank';
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        setDownloadingId(null);
        setSavedId(format.id);
        setTimeout(() => setSavedId(null), 2500);
      }, 1500);
    } catch (err) {
      console.error('Download stream error:', err);
      setDownloadingId(null);
    }
  };

  const handleResetClick = () => {
    onReset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <section className="w-full border-t border-dashed border-[var(--colors-hairline)] bg-[var(--colors-canvas)] transition-colors">
      {/* Top Header Bar inside Preview - Spans full width edge-to-edge connecting with dashed grid */}
      <div className="w-full border-b border-dashed border-[var(--colors-hairline)]">
        <div className="max-w-7xl mx-auto border-x border-dashed border-[var(--colors-hairline)] px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Platform Pill & Timestamp */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs capitalize px-2.5 py-1 rounded-full bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-ink)] font-semibold">
              {getPlatformIcon()}
              <span>{media.platform}</span>
            </span>

            <span className="font-mono text-xs text-[var(--colors-muted)]">
              {media.extractedAt}
            </span>
          </div>

          {/* Right: New Extract Trigger */}
          <button
            type="button"
            onClick={handleResetClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--colors-hairline)] bg-[var(--colors-surface-card)] hover:bg-[var(--colors-surface-elevated)] text-[var(--colors-body)] hover:text-[var(--colors-ink)] font-mono text-xs transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Extract</span>
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
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Slide Counter / Duration Overlay — Frosted Glass Badge */}
              {isCollection ? (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 font-mono text-xs pointer-events-none">
                  <span className="px-2.5 py-1 rounded-md bg-black/40 border border-white/20 text-white backdrop-blur-md backdrop-saturate-150 font-semibold shadow-lg shadow-black/25">
                    Slide {activeSlideIndex + 1} of {totalSlides}
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
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-xs pointer-events-auto transition-all cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Next slide"
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-xs pointer-events-auto transition-all cursor-pointer active:scale-95"
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
                    Album Slides ({media.items.length})
                  </span>
                  <span className="font-mono text-[11px] text-[var(--colors-muted)]">
                    Click to inspect
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {media.items.slice(0, 8).map((item, index) => {
                    const isSelected = index === activeSlideIndex;
                    const isLastSlot = index === 7 && media.items!.length > 8;
                    const remainingCount = media.items!.length - 7;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSlideIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--colors-ink)] ring-2 ring-[var(--colors-ink)]/20'
                            : 'border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)] opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnail || item.url}
                          alt={`Slide ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-[10px] font-mono text-white backdrop-blur-xs font-medium shadow-xs">
                          #{index + 1}
                        </span>
                        {isLastSlot && (
                          <div className="absolute inset-0 bg-black/85 flex items-center justify-center font-mono text-xs font-bold text-white">
                            +{remainingCount}
                          </div>
                        )}
                      </button>
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
                      <img src={media.author.avatar} alt={media.author.name} className="w-full h-full object-cover" />
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

              {/* Single Clean Decoded Title & Description */}
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
                  Available Streams ({displayedFormats.length})
                </span>
              </div>
            </div>

            {/* List of Formats */}
            <div className="space-y-2.5">
              {displayedFormats.map((format) => {
                const isDownloading = downloadingId === format.id;
                const isSaved = savedId === format.id;
                const isZip = format.type === 'archive' || format.extension === 'ZIP';

                const getIcon = () => {
                  if (isZip) return <Archive className="w-3.5 h-3.5 text-[var(--colors-ink)]" />;
                  if (format.type === 'image') return <ImageIcon className="w-3.5 h-3.5" />;
                  if (format.type === 'video') return <Film className="w-3.5 h-3.5" />;
                  if (format.type === 'audio') return <Music className="w-3.5 h-3.5" />;
                  return <Film className="w-3.5 h-3.5" />;
                };

                return (
                  <div
                    key={format.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs ${
                      isZip
                        ? 'bg-[var(--colors-surface-elevated)] border-[var(--colors-hairline-strong)] ring-1 ring-[var(--colors-ink)]/10'
                        : 'bg-[var(--colors-surface-card)] border-[var(--colors-hairline)] hover:border-[var(--colors-hairline-strong)]'
                    }`}
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

                      {/* Real Metadata Badges (File Size, Extension, Quality) */}
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--colors-muted)]">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--colors-surface-elevated)] border border-[var(--colors-hairline)] text-[var(--colors-body)]">
                          {format.extension}
                        </span>
                        <span>{format.size}</span>
                        {format.quality && <span>• {format.quality}</span>}
                      </div>
                    </div>

                    {/* Functional Download Button with Real Stream Pipe */}
                    <button
                      type="button"
                      onClick={() => handleDownload(format)}
                      disabled={isDownloading}
                      aria-label={`Download ${format.label}`}
                      className={`px-3.5 py-1.5 rounded-lg font-body font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75 min-w-[110px] active:scale-95 ${
                        isZip
                          ? 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90'
                          : 'bg-[var(--colors-ink)] text-[var(--colors-canvas)] hover:opacity-90'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-[var(--colors-canvas)] border-t-transparent rounded-full animate-spin" />
                          <span>{isZip ? 'Packaging...' : 'Streaming...'}</span>
                        </>
                      ) : isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isZip && packagedZipSize ? `Ready • ${packagedZipSize}` : 'Saved'}</span>
                        </>
                      ) : isZip ? (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Download All (.ZIP)</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Note box */}
            <div className="p-2.5 rounded-lg border border-dashed border-[var(--colors-hairline)] bg-[var(--colors-surface-elevated)] flex items-start gap-2">
              <span className="font-mono text-[11px] text-[var(--colors-muted)] leading-relaxed">
                ℹ Streams are processed on-the-fly without storage retention. Cleaned of tracking pixels and overlays.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
}
