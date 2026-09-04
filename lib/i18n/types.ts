export type Locale = 'en' | 'ar';

export interface TranslationDictionary {
  nav: {
    status: string;
    github: string;
    langToggle: string;
  };
  hero: {
    brand: string;
    title: string;
    subtitle: string;
    placeholder: string;
    pasteBtn: string;
    extractBtn: string;
    extracting: string;
    errorInvalid: string;
  };
  terminal: {
    title: string;
    command: string;
    resolveTitle: (platformName: string) => string;
    resolveDetail: string;
    fetchTitle: string;
    fetchDetail: (meta?: string) => string;
    readyTitle: string;
    readyDetail: string;
    rejectedTitle: string;
    networkFailureTitle: string;
  };
  preview: {
    newExtract: string;
    availableStreams: string;
    download: string;
    downloadAllZip: string;
    downloadAllZipCard: string;
    downloadAllZipDesc: string;
    videoHdZipCard: string;
    videoHdZipDesc: string;
    videoSdZipCard: string;
    videoSdZipDesc: string;
    videoEverythingZipCard: string;
    videoEverythingZipDesc: string;
    everythingZipCard: string;
    everythingZipDesc: string;
    selectPhotos: string;
    selectPhotosDesc: string;
    selectBtn: string;
    modalTitle: string;
    modalSelectAll: string;
    modalDeselectAll: string;
    modalSelectedCount: (count: number, total: number) => string;
    modalDownloadSelected: (count: number) => string;
    modalDownloadSelectedZip: (count: number) => string;
    modalDownloadAllZip: string;
    modalClose: string;
    packaging: string;
    streaming: string;
    saved: string;
    slideOf: string;
    albumSlides: (count: number) => string;
    clickToInspect: string;
    downloadPhoto: (index: number) => string;
    allPhotos: (count: number) => string;
    originalMaster: string;
    losslessZipPackage: string;
    zipHint: string;
    compressing: string;
    saving: string;
    directStream: string;
    notice: string;
  };
  recents: {
    title: string;
    clear: string;
    more: string;
    collapse: string;
  };
  metrics: {
    col1: { val: string; label: string; caption: string };
    col2: { val: string; label: string; caption: string };
    col3: { val: string; label: string; caption: string };
  };
  howItWorks: {
    title: string;
    subtitle: string;
    step1: { num: string; title: string; desc: string };
    step2: { num: string; title: string; desc: string };
    step3: { num: string; title: string; desc: string };
  };
  faq: {
    title: string;
    subtitle: string;
    items: Array<{
      id: string;
      question: string;
      answer: string;
      technicalNote: string;
    }>;
  };
  platforms: {
    eyebrow: string;
    title: string;
    subtitle: string;
    formatsTitle: string;
    live: string;
    next: string;
    planned: string;
    items: Record<string, {
      name: string;
      formats: string;
    }>;
  };
  diagnostic: {
    tryAnother: string;
    retry: string;
    waiting: string;
    escReset: string;
    titles: {
      notYetSupported: string;
      unrecognizedLink: string;
      mediaUnreachable: string;
      gatewayTimeout: string;
      rateLimited: string;
      extractionFailed: string;
    };
    descriptions: {
      pipelinePending: (platform?: string) => string;
      unsupportedPlatform: (platform?: string) => string;
      invalidUrl: string;
      mediaUnreachable: string;
      gatewayTimeout: string;
      rateLimited: string;
      extractionFailed: string;
    };
  };
  footer: {
    builtBy: string;
    license: string;
    architecture: string;
    github: string;
  };
  ticker: string[];
}
