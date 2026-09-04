import { TranslationDictionary } from '../types';

export const en: TranslationDictionary = {
  nav: {
    status: 'Open-Source Media Parser',
    github: 'GitHub',
    langToggle: 'AR',
  },
  hero: {
    brand: 'Oxiv',
    title: 'Extract raw media effortlessly.',
    subtitle: 'No watermarks, no middleman, and zero re-encoding.',
    placeholder: 'Paste link here...',
    pasteBtn: 'Paste',
    extractBtn: 'Extract',
    extracting: 'Extracting...',
    errorInvalid: 'Please provide a valid social media URL.',
  },
  terminal: {
    title: 'Extraction Stream Protocol',
    command: 'extract',
    resolveTitle: (platform: string) => `Resolving target ${platform} endpoint`,
    resolveDetail: '↳ Locating direct media resource URL',
    fetchTitle: 'Original media payload retrieved',
    fetchDetail: (meta?: string) => meta ? `↳ Media detected (${meta})` : '↳ Fetching direct unwatermarked source stream',
    readyTitle: 'Direct download stream ready',
    readyDetail: '↳ Stream payload ready for browser delivery',
    rejectedTitle: 'Extraction request rejected by engine',
    networkFailureTitle: 'Network extraction gateway unreachable',
  },
  preview: {
    newExtract: 'New Extract',
    availableStreams: 'Available Streams',
    download: 'Download',
    downloadAllZip: 'Download All (.ZIP)',
    downloadAllZipCard: 'Download All (ZIP)',
    downloadAllZipDesc: 'Video + Audio bundled together',
    videoHdZipCard: 'HD + Audio (ZIP)',
    videoHdZipDesc: 'HD video + isolated soundtrack bundled',
    videoSdZipCard: 'SD + Audio (ZIP)',
    videoSdZipDesc: 'SD video + isolated soundtrack bundled',
    videoEverythingZipCard: 'Everything (ZIP)',
    videoEverythingZipDesc: 'HD + SD video + isolated soundtrack all together',
    everythingZipCard: 'Everything (ZIP)',
    everythingZipDesc: 'All photos + audio bundled together',
    selectPhotos: 'Select Photos',
    selectPhotosDesc: 'Choose specific photos to download',
    selectBtn: 'Select…',
    modalTitle: 'Select Photos to Download',
    modalSelectAll: 'Select All',
    modalDeselectAll: 'Deselect All',
    modalSelectedCount: (count: number, total: number) => `${count} of ${total} photos selected`,
    modalDownloadSelected: (count: number) => `Download Selected (${count})`,
    modalDownloadSelectedZip: (count: number) => `Download Selected as ZIP (${count})`,
    modalDownloadAllZip: 'Download All (.ZIP)',
    modalClose: 'Close',
    packaging: 'Packaging ZIP…',
    streaming: 'Streaming…',
    saved: 'Saved',
    slideOf: 'Slide',
    albumSlides: (count: number) => `Album: ${count} slides detected`,
    clickToInspect: 'Click to inspect full resolution',
    downloadPhoto: (index: number) => `Photo ${index}`,
    allPhotos: (count: number) => `All ${count} Photos (ZIP)`,
    originalMaster: 'Original master asset',
    losslessZipPackage: 'Lossless ZIP package containing all raw photos',
    zipHint: 'Files are fetched and compressed before saving — progress shown below.',
    compressing: 'Compressing files…',
    saving: 'Saving…',
    directStream: 'Direct uncompressed stream',
    notice: 'Direct client-side stream. Files are never stored or logged on intermediary servers.',
  },
  recents: {
    title: 'Recent Extractions',
    clear: 'Clear',
    more: 'more',
    collapse: 'Collapse',
  },
  metrics: {
    col1: { val: '100%', label: 'Original Quality', caption: 'Bitrate and spatial dimensions intact. Zero compression artifacts.' },
    col2: { val: '0', label: 'Watermarks', caption: 'Raw origin streams with no vendor overlays or badges.' },
    col3: { val: '0', label: 'Server Logs', caption: 'Completely stateless. Zero data retained on backend infrastructure.' },
  },
  howItWorks: {
    title: 'How it works.',
    subtitle: 'Three lightweight steps. No signup, no waiting rooms.',
    step1: { num: '01', title: 'Paste URL', desc: 'Drop any valid link from TikTok, Pinterest, Instagram, or X.' },
    step2: { num: '02', title: 'Instant Extract', desc: 'Oxiv isolates the CDN media endpoint and unpacks all variants.' },
    step3: { num: '03', title: 'Direct Download', desc: 'Stream files cleanly to your device with original metadata.' },
  },
  faq: {
    title: 'Frequently asked questions.',
    subtitle: 'Technical specifications, architecture details, and privacy boundaries.',
    items: [
      {
        id: 'faq-1',
        question: 'Does Oxiv re-encode or compress downloaded media?',
        answer:
          'No. Oxiv resolves and serves the exact origin source stream provided by upstream CDN edge servers. Spatial dimensions, color profiles, audio sample rates, and bitrates remain 100% bit-for-bit identical to the source master.',
        technicalNote: 'Pure bitstream passthrough with zero transcode pipelines.',
      },
      {
        id: 'faq-2',
        question: 'Is any media or user data retained on your servers?',
        answer:
          'No. Oxiv operates under a strict stateless zero-retention architecture. Media payloads are piped directly in-memory to the client runtime without persistence layers, caches, databases, or analytics tracking.',
        technicalNote: 'Stateless edge runtime with no persistent volume or database attachments.',
      },
      {
        id: 'faq-3',
        question: 'How does client-side downloading bypass CORS restrictions?',
        answer:
          'Requests proxy through a dedicated minimal backend stream route (/api/download) that handles upstream origin headers and streams bytes directly with standard Content-Disposition attachments.',
        technicalNote: 'Proxied binary stream delivery with forced download headers.',
      },
      {
        id: 'faq-4',
        question: 'Where is the Recent Extractions history saved?',
        answer:
          'Extraction history is stored exclusively in your browser localStorage sandbox. No search queries or extracted URLs ever touch our backend databases or telemetry pipelines.',
        technicalNote: 'Client-only storage with instant local purge capabilities.',
      },
      {
        id: 'faq-5',
        question: 'Why does the clipboard paste prompt ask for permission?',
        answer:
          'Browsers enforce differing security boundaries on the asynchronous Clipboard API (navigator.clipboard.readText()). While Chromium-based engines allow persistent domain-level permissions, Gecko-based engines (Firefox desktop and mobile) require an explicit user confirmation prompt per read event to mitigate unauthorized clipboard access by third-party scripts.',
        technicalNote:
          'Enforced browser-level security sandbox. Standard keyboard paste (Ctrl+V / long-press) remains direct.',
      },
      {
        id: 'faq-6',
        question: 'Why does my browser ask for permission when downloading multiple photos?',
        answer:
          'Certain web browsers (such as Google Chrome) display a one-time security prompt requesting confirmation before allowing a website to trigger multiple consecutive file downloads. This is standard browser security sandboxing behavior rather than an Oxiv restriction. Simply click "Allow" to let your browser receive all selected assets normally. Other browser engines (such as Mozilla Firefox) may permit sequential multi-file streams without displaying this confirmation.',
        technicalNote:
          'Standard browser-level concurrent download throttling; requires one-time domain clearance.',
      },
      {
        id: 'faq-7',
        question: 'Why do ZIP bundle downloads show a progress sequence instead of starting immediately?',
        answer:
          'Unlike single-file streams that trigger an immediate browser save dialog, archive bundles (such as combining video with audio, or packaging multi-photo albums) must first fetch each individual stream into your browser’s memory. Once all assets are collected, Oxiv packages them client-side into an uncompressed ZIP container via fflate before triggering the final file save. This staged sequence (fetching each file, compressing, then saving) reflects active, real-time work happening entirely inside your browser runtime. Total duration scales naturally with the number and size of items, and zero media data is ever retained or stored on any intermediary server.',
        technicalNote:
          'Client-side in-memory aggregation via ReadableStream chunks and zero-compression fflate assembly.',
      },
    ],
  },
  platforms: {
    eyebrow: 'PLATFORMS',
    title: 'Supported platforms.',
    subtitle: 'Every format Oxiv can pull, per platform — no watermarks, no re-encoding.',
    formatsTitle: 'Supported link formats.',
    live: 'LIVE',
    next: 'NEXT',
    planned: 'PLANNED',
    items: {
      tiktok: {
        name: 'TikTok',
        formats: 'MP4 (no watermark), MP3 audio, image slideshow + ZIP',
      },
      pinterest: {
        name: 'Pinterest',
        formats: 'Original master image, progressive MP4',
      },
      facebook: {
        name: 'Facebook',
        formats: 'Coming next',
      },
      instagram: {
        name: 'Instagram',
        formats: 'Reels MP4, Posts Carousel, Audio',
      },
      x: {
        name: 'X',
        formats: 'AVC1 MP4, Lossless GIF, Audio',
      },
      youtube: {
        name: 'YouTube',
        formats: 'Video MP4, Audio',
      },
    },
  },
  diagnostic: {
    tryAnother: 'Try Another Link',
    retry: 'Retry',
    waiting: 'Waiting (2s)...',
    escReset: 'to reset',
    titles: {
      notYetSupported: 'Not Yet Supported',
      unrecognizedLink: 'Unrecognized Link',
      mediaUnreachable: 'Media Unreachable',
      gatewayTimeout: 'Connection Timed Out',
      rateLimited: 'Rate Limited',
      extractionFailed: 'Extraction Failed',
    },
    descriptions: {
      pipelinePending: (platform?: string) => `We are actively building the parser for ${platform || 'this platform'}. Support is scheduled in the next pipeline update.`,
      unsupportedPlatform: (platform?: string) => `${platform || 'This service'} is not currently in our deployment queue.`,
      invalidUrl: 'Please verify the link structure and ensure it matches a supported format.',
      mediaUnreachable: 'The host platform returned a 404 or restricted access to this post (it may be private, removed, or geo-locked).',
      gatewayTimeout: 'The platform server took too long to respond. Please try again.',
      rateLimited: 'Upstream rate limit reached. Please wait a moment before trying again.',
      extractionFailed: 'An error occurred while parsing media streams for this link.',
    },
  },
  features: {
    eyebrow: 'DIFFERENTIATORS',
    title: 'Built without compromise.',
    subtitle: 'Architectural capabilities designed for lossless extraction, granular bundling, and complete privacy.',
    items: {
      multiPhoto: {
        title: 'Full Multi-Photo Extraction',
        desc: 'Even large albums with dozens of photos are fully extracted — bypassing the truncation limits common in other tools.',
      },
      zipBundling: {
        title: 'Quality-Selectable ZIP Bundling',
        desc: 'Choose HD, SD, or all video variants packaged alongside isolated soundtracks in one organized archive.',
      },
      liveProgress: {
        title: 'Real-Time Packaging Progress',
        desc: 'Watch live chunk-by-chunk download and compression progress directly in the browser instead of a frozen spinner.',
      },
      zeroStorage: {
        title: 'Zero Server Storage',
        desc: 'Every extraction and ZIP bundle executes entirely in client-side memory. No media or query history touches our disks.',
      },
      noWatermarks: {
        title: 'Original Masters, No Login',
        desc: 'Direct CDN edge media without vendor watermarks, re-encoding badges, accounts, or authentication tokens.',
      },
      directPassthrough: {
        title: 'Pure Bitstream Passthrough',
        desc: 'Color profiles, spatial dimensions, and audio bitrates remain 100% bit-for-bit identical to upstream masters.',
      },
    },
  },
  activity: {
    backToHome: 'Back to Oxiv',
    title: 'Development Activity',
    subtitle: 'Live commit ledger and contribution rhythm tracked directly from the xsiphr/Oxiv repository.',
    viewOnGithub: 'View on GitHub',
    totalCommits: (count: number) => `${count} recent commits recorded`,
    heatmapTitle: 'Contribution Heatmap',
    heatmapSubtitle: 'Daily commit cadence aggregated over the active development cycle.',
    legendLess: 'Fewer',
    legendMore: 'More',
    historyTitle: 'Recent Commit History',
    commitsTooltip: (count: number, date: string) => `${count} ${count === 1 ? 'commit' : 'commits'} on ${date}`,
    fallbackTitle: 'Activity Ledger Temporarily Unavailable',
    fallbackDesc: 'GitHub API rate limit reached or network connection dropped. You can still inspect commits directly on GitHub.',
    showMore: (count: number) => `Show more (+${count} commits)`,
    showLess: 'Show less',
  },
  footer: {
    builtBy: 'Architected for lossless media extraction.',
    license: 'MIT Licensed',
    architecture: 'Stateless Edge Architecture',
    github: 'GitHub',
  },
  ticker: [
    'NO WATERMARKS · NO RETENTION · NO LIMITS · 100% LOSSLESS · DIRECT CDN STREAM ·',
  ],
};
