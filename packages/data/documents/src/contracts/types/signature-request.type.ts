/**
 * Stackra file contract:
 * Purpose: `SignatureRequest`, what a caller hands an `ESignatureProvider` to open an envelope: the PDF, its content
 *          hash, the signers and the caller's own reference.
 * Boundary: a type only. `reference` is the idempotency key: sending the same reference twice answers the envelope the
 *           first send opened. `contentHash` is the `sha256:<hex>` of `document`, so the signed copy can be traced to
 *           what was sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decisions 4 and 5).
 */
import type { SignatureSigner } from "#contracts/types/signature-signer.type";

/** A request to sign one PDF. */
export interface SignatureRequest {
  /** The caller's id for this request (a form submission's public id); one envelope per reference. */
  readonly reference: string;

  /** The title the signers see. */
  readonly title: string;

  /** The PDF to sign. */
  readonly document: Uint8Array;

  /** `sha256:<hex>` of `document`. */
  readonly contentHash: string;

  /** Who signs, in `order`. */
  readonly signers: readonly SignatureSigner[];

  /** The BCP 47 locale the provider's screens and emails use. */
  readonly locale: string;
}
