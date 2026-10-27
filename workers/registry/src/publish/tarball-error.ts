/**
 * Stackra file contract:
 * Purpose: `TarballError`: A tarball the registry cannot read.
 * Boundary: reads bytes only; keeps no file body but package.json. Throws `TarballError` on a malformed archive, a
 *           missing package.json or an unpacked size over the limit.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 7).
 */

/** A tarball the registry cannot read. */
export class TarballError extends Error {
  override readonly name = "TarballError";
}
