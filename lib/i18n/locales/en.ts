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
