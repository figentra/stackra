/**
 * Stackra file contract:
 * Purpose: `DocsLocaleFont`, the web font a docs site loads for one language: its family and its stylesheet URL.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (Fumadocs docs sites); brand family/i18n/ar-voice.md §7.
 */

/** A web font of one language. */
export interface DocsLocaleFont {
  /** The CSS font family. */
  readonly family: string;

  /** The stylesheet that loads it. */
  readonly href: string;
}
