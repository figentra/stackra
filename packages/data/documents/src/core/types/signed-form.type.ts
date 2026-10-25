/**
 * Stackra file contract:
 * Purpose: `SignedForm`, a form signed on a device: the PDF with the drawn signature placed in it, the PDF's content
 *          hash (on `pdf`), the signature image's own hash, the signer and when they signed.
 * Boundary: a type only; the caller stores it (OS files) and audits it. The two hashes let a reviewer show that the
 *           stored PDF and signature are the ones captured.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 4).
 */
import type { RenderedDocument } from "#core/types/rendered-document.type";

/** A signed form PDF. */
export interface SignedForm {
  /** The PDF; its `contentHash` covers the whole file, signature included. */
  readonly pdf: RenderedDocument;

  /** `sha256:<hex>` of the signature image's bytes. */
  readonly signatureHash: string;

  /** The signer's name, as printed. */
  readonly signerName: string;

  /** When they signed (ISO 8601). */
  readonly signedAt: string;
}
