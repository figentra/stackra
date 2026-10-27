/**
 * Stackra file contract:
 * Purpose: `ContentFreeData`, everything a content-free template renders for a restricted record: the record's kind
 *          (an already translated label, "matter", "safeguarding notice") and a link to it, where the reader signs in.
 * Boundary: a type only. No field of the record itself: the caller builds it from the record's kind and route, never
 *           from its content; `assertContentFree` refuses a template that reads anything else.
 * Runtime: isomorphic
 * Governing contract: row "content-free templates for restricted records" of the package needs; ADR 0231; STA-964.
 */

/** The values of a content-free template. */
export interface ContentFreeData {
  /** The record's kind, as a label in the recipient's language. */
  readonly kind: string;

  /** The URL that opens the record after sign-in. */
  readonly link: string;
}
