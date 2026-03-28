// lib/punycode-polyfill.ts
// Simple punycode implementation to avoid deprecated Node.js module
export const punycode = {
  toASCII(input: string): string {
    // If already ASCII, return as-is
    if (/^[\x00-\x7F]+$/.test(input)) {
      return input;
    }

    // Basic punycode encoding for non-ASCII
    try {
      // Use built-in URL API for domain encoding
      return new URL(`http://${input}`).hostname;
    } catch {
      return input;
    }
  },

  toUnicode(input: string): string {
    try {
      return new URL(`http://${input}`).hostname;
    } catch {
      return input;
    }
  },
};
