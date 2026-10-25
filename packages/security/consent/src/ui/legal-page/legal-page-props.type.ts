/**
 * Stackra file contract:
 * Purpose: `LegalPageProps`, one legal page as the OS compliance service hands it: its title, version, the date it
 *          takes effect and its text.
 * Boundary: a type only. The text is plain text with blank lines between paragraphs, written by counsel per market and
 *           language; it is never HTML, so nothing from it is injected into the page.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #29 (legal pages; OS compliance holds the texts); ADR 0294 (decision 8).
 */

/** Props of `LegalPage`. */
export interface LegalPageProps {
  /** The page's title (privacy notice, terms, cookie policy, sub-processors, imprint). */
  readonly title: string;

  /** The version shown and accepted. */
  readonly version: string;

  /** When this version takes effect, as the page shows it (already formatted for the locale). */
  readonly effectiveFrom: string;

  /** The text: paragraphs separated by blank lines. */
  readonly body: string;
}
