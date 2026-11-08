/**
 * Stackra file contract:
 * Purpose: `HtmlPolicy`, what `sanitizeHtml` lets through: each allowed tag (lower case) with the attributes it may
 *          keep, and the tags whose content is dropped with them.
 * Boundary: a type only. `RICH_TEXT_HTML_POLICY` is the default; a host narrows it, never widens it to a script, a
 *           style, an event-handler attribute or `style`.
 * Runtime: isomorphic
 * Governing contract: OWASP XSS prevention (allowlist sanitization); STA-2562 frontend audit item (b).
 */

/** An allowlist of tags and attributes. */
export interface HtmlPolicy {
  /** Each allowed tag to the attributes it keeps; `href` is kept only with an http(s), mailto, relative or `#` URL. */
  readonly tags: Readonly<Record<string, readonly string[]>>;
  /** Tags dropped together with everything inside them. */
  readonly dropWithContent: readonly string[];
}
