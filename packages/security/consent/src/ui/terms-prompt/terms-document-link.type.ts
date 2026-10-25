/**
 * Stackra file contract:
 * Purpose: `TermsDocumentLink`, one document the terms prompt asks a person to accept: its key, version, title and
 *          the page that shows it.
 * Boundary: a type only; the list is `ConsentProofService.pending` joined with the compliance service's titles.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #29; ADR 0294 (decision 8).
 */

/** One document to accept. */
export interface TermsDocumentLink {
  /** The document key. */
  readonly key: string;

  /** The version being accepted. */
  readonly version: string;

  /** Its title. */
  readonly title: string;

  /** Its page (`LegalPage`). */
  readonly href: string;
}
