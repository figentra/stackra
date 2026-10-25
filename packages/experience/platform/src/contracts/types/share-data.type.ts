/**
 * Stackra file contract:
 * Purpose: `ShareData`, what the app hands to the system share sheet: a title, text, a link and files, each optional.
 * Boundary: a type only, the Web Share API's own fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2).
 */

/** What to share. */
export interface ShareData {
  /** A title for the share sheet. */
  readonly title?: string;

  /** Text to share. */
  readonly text?: string;

  /** A link to share. */
  readonly url?: string;

  /** Files to share. */
  readonly files?: readonly File[];
}
