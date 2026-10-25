/**
 * Stackra file contract:
 * Purpose: `SignatureRequest`, what a driver asks the host's signer to sign: the unit whose key signs, the format, the
 *          payload and its SHA-256 digest.
 * Boundary: a type only; the key and certificate stay with the signer (an HSM, a token, a cloud seal).
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */
import type { SignatureFormat } from "#contracts/enums/signature-format.enum";

/** One signing call. */
export type SignatureRequest = {
  /** The unit whose key and certificate sign. */
  readonly unitId: string;
  /** The form the mandate needs. */
  readonly format: SignatureFormat;
  /** The text to sign (or to envelope, for XAdES). */
  readonly payload: string;
  /** Base64 SHA-256 of the document as the mandate defines it. */
  readonly digest: string;
};
