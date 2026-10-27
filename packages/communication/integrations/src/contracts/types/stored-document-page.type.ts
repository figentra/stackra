/**
 * Stackra file contract:
 * Purpose: `StoredDocumentPage`, one page of documents a document store lists, with the cursor of the next page.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 6).
 */
import type { StoredDocument } from "#contracts/types/stored-document.type";

/** A page of stored documents. */
export interface StoredDocumentPage {
  /** The documents on this page. */
  readonly documents: readonly StoredDocument[];

  /** The cursor of the next page; undefined on the last. */
  readonly next?: string;
}
