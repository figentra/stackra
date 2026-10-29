/**
 * Stackra file contract:
 * Purpose: `escapeHtml`: text made safe for HTML content and quoted attribute values.
 * Boundary: pure.
 * Runtime: worker
 * Governing contract: ADR 0453.
 */

const ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Text made safe for HTML content and quoted attribute values.
 *
 * @example
 * escapeHtml('<a href="x">'); // "&lt;a href=&quot;x&quot;&gt;"
 */
export const escapeHtml = (text: string): string =>
  text.replaceAll(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
