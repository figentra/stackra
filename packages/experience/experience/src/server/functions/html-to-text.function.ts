/**
 * Stackra file contract:
 * Purpose: `htmlToText`, the plain-text alternative of a rendered email: block elements become line breaks, links keep
 *          their address, tags are dropped and the five entities `escapeHtml` writes are read back.
 * Boundary: pure; internal to `./server`. It reads only HTML the node renderer wrote, so it is not a general HTML
 *           parser: no script or style content is expected (blocks write none).
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 6); ADR 0035 (email with a text part).
 */

/** The entities `escapeHtml` writes, read back. */
const ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/**
 * The plain text of `html`.
 *
 * @example
 * htmlToText('<p>Hi</p><a href="https://x.test">Track</a>'); // "Hi\nTrack (https://x.test)"
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<head>[\s\S]*?<\/head>/gi, "")
    .replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|table|section|header|footer)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
