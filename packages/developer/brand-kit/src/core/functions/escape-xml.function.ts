/**
 * Stackra file contract:
 * Purpose: `escapeXml`, escapes text for an SVG text node or attribute value (store captions, font stacks).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D19 captions).
 */

const ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/**
 * `text` safe inside SVG markup.
 *
 * @example
 * escapeXml('Size & "fit"'); // 'Size &amp; &quot;fit&quot;'
 */
export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}
