/**
 * Stackra file contract:
 * Purpose: `RenderedDocument`, the output of a render: format, media type, bytes and their content hash.
 * Boundary: a type only. `contentHash` is `sha256:<hex>` of `bytes`; files store it beside the file and
 *           `verifyContentHash` checks it later.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decisions 2 and 4).
 */
import type { DocumentFormat } from "#core/enums/document-format.enum";

/** A rendered file. */
export interface RenderedDocument {
  /** What was written. */
  readonly format: DocumentFormat;

  /** Its media type. */
  readonly mediaType: string;

  /** The file. */
  readonly bytes: Uint8Array;

  /** `sha256:<hex>` of `bytes`. */
  readonly contentHash: string;
}
