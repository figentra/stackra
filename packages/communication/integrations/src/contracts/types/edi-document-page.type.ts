/**
 * Stackra file contract:
 * Purpose: `EdiDocumentPage`, one page of documents an EDI network holds for us, with the cursor of the next page.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0218 (decision 3: syncs); ADR 0447 (decision 4).
 */
import type { EdiDocument } from "#contracts/types/edi-document.type";

/** A page of received EDI documents. */
export interface EdiDocumentPage {
  /** The documents, oldest first, each with its network `id`. */
  readonly documents: readonly EdiDocument[];

  /** The cursor of the next page; undefined on the last. */
  readonly next?: string;
}
