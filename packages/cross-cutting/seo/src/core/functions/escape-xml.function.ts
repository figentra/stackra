/**
 * Stackra file contract:
 * Purpose: `escapeXml`, the escaping of one text or attribute value of a sitemap: the five XML special characters
 *          become entities, so a URL or date can never close an element or an attribute.
 * Boundary: internal; the sitemap writers call it on every value they write. Characters XML 1.0 cannot carry at all
 *           (control characters other than tab, line feed and carriage return) are refused, not dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2); XML 1.0 section 2.2.
 */

/** Whether the UTF-16 code unit is one XML 1.0 forbids: a control character other than tab, LF, CR, or U+FFFE/F. */
const isForbidden = (code: number) =>
  (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) ||
  code === 0xfffe ||
  code === 0xffff;

/** The entity of each special character. */
const ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/**
 * `value` safe inside an XML element or a quoted attribute.
 *
 * @throws TypeError when `value` holds a character XML 1.0 cannot carry.
 */
export function escapeXml(value: string): string {
  for (let index = 0; index < value.length; index++) {
    if (isForbidden(value.charCodeAt(index))) {
      throw new TypeError("A sitemap value holds a character XML cannot carry");
    }
  }
  return value.replace(/[&<>"']/g, (character) => ENTITIES[character] ?? character);
}
