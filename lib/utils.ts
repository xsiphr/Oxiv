/**
 * Shared Utility Functions
 */

/**
 * Decodes all HTML entities including named, decimal (Cyrillic, Arabic, Emojis), and hex entities.
 * Handles double-encoded entities and surrogate pair codepoints cleanly.
 */
export function decodeHtmlEntities(input?: string): string {
  if (!input) return '';

  const named: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#039;': "'",
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&trade;': '™',
    '&copy;': '©',
    '&reg;': '®',
  };

  let str = input;
  // Run up to 2 passes to resolve double-encoded entities (e.g. &amp;#1593;)
  for (let pass = 0; pass < 2; pass++) {
    for (const [key, val] of Object.entries(named)) {
      str = str.replaceAll(key, val);
    }

    // Decimal entities: &#128293; or &#1057; or &#1593;
    str = str.replace(/&#(\d+);/g, (_, dec) => {
      try {
        const code = parseInt(dec, 10);
        return String.fromCodePoint(code);
      } catch {
        return _;
      }
    });

    // Hex entities: &#x1F525; or &#x2014;
    str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        const code = parseInt(hex, 16);
        return String.fromCodePoint(code);
      } catch {
        return _;
      }
    });
  }

  return str.trim();
}
