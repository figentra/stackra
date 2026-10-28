/**
 * Stackra file contract:
 * Purpose: `TarballDigests`: the digests of one tarball.
 * Boundary: pure Web Crypto; no I/O.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 8).
 */

/** The digests of one tarball. */
export interface TarballDigests {
  /** `sha512-<base64>`, the npm `dist.integrity`. */
  readonly integrity: string;
  /** SHA-1 hex, the npm `dist.shasum`. */
  readonly shasum: string;
  /** SHA-256 hex, matched against a provenance subject that names one. */
  readonly sha256: string;
  /** SHA-512 hex, matched against the provenance subject npm writes (`digest.sha512`). */
  readonly sha512: string;
}
