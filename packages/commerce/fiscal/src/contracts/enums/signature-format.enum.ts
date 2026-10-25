/**
 * Stackra file contract:
 * Purpose: `SignatureFormat`, the form a driver asks the host's signer for: an enveloped XAdES signature, a CAdES-BES
 *          seal, a compact JWS, or a raw signature over the payload.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. The driver picks the format its
 *           mandate defines; the signer holds the key and the certificate. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * Each driver uses exactly one format.
 *
 * @example
 * await signer.sign({ unitId, format: SignatureFormat.Cades, payload: canonical, digest });
 */
export const SignatureFormat = Enum.of({
  /** XAdES enveloped in the XML; the signer returns the signed document. */
  Xades: "xades",
  /** CAdES-BES detached over the digest (a token or cloud seal). */
  Cades: "cades",
  /** The signature part of a compact JWS over the payload, base64url. */
  Jws: "jws",
  /** A raw signature over the payload, base64url. */
  Raw: "raw",
});

/** One of the codes above. */
export type SignatureFormat = Enum.Value<typeof SignatureFormat>;
