/**
 * Stackra file contract:
 * Purpose: `SignatureResult`, what the signer returns: the signature value, the signed document for enveloping
 *          formats, and the certificate facts a receipt QR may carry.
 * Boundary: a type only; public material only, never a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */

/** One signature. */
export type SignatureResult = {
  /** The signature value (base64, or base64url for `jws` and `raw`). */
  readonly value: string;
  /** The document with the signature enveloped (XAdES); `null` for detached formats. */
  readonly signedPayload: string | null;
  /** The signing public key, base64 DER, when the format publishes it. */
  readonly publicKey: string | null;
  /** The issuer's signature over the signing certificate, base64, when the format publishes it. */
  readonly certificateSignature: string | null;
};
