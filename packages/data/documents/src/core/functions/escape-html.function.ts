/**
 * Stackra file contract:
 * Purpose: `escapeHtml`, text made safe for HTML content and attribute values.
 * Boundary: internal to this package (`renderHtml`); not exported from the entry. Every template text and data value
 *           passes through it, so neither can inject markup into a document.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0154 (no tenant markup).
 */

/** The entity of each character HTML gives meaning to. */
const ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** `text` with `& < > " '` escaped. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/gu, (character) => ENTITIES[character] ?? character);
}
