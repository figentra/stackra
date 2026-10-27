/**
 * Stackra file contract:
 * Purpose: `DocumentFile`, the bytes of a document going to or coming from a document store, with its name and media
 *          type.
 * Boundary: a type only. The bytes are held in memory for one call; a large file streams through the files package, not
 *           through this type.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 6).
 */

/** A document's content. */
export interface DocumentFile {
  /** The file name. */
  readonly name: string;

  /** The media type. */
  readonly contentType: string;

  /** The content. */
  readonly bytes: Uint8Array;
}
