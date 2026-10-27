/**
 * Stackra file contract:
 * Purpose: `tarballDigests`: the integrity, shasum and SHA-256 of a tarball.
 * Boundary: pure Web Crypto; no I/O.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 8).
 */
import { toBase64 } from "#src/bytes/to-base64";
import { toHex } from "#src/bytes/to-hex";
import type { Bytes } from "#src/interfaces/bytes.type";
import type { TarballDigests } from "#src/interfaces/tarball-digests.interface";

/** A digest of bytes. */
async function digest(algorithm: string, bytes: Bytes): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.digest(algorithm, bytes));
}

/**
 * The integrity, shasum and SHA-256 of a tarball.
 *
 * @example
 * const { integrity } = await tarballDigests(tarball); // "sha512-…"
 */
export async function tarballDigests(tarball: Bytes): Promise<TarballDigests> {
  const [sha512, sha1, sha256] = await Promise.all([
    digest("SHA-512", tarball),
    digest("SHA-1", tarball),
    digest("SHA-256", tarball),
  ]);
  return { integrity: `sha512-${toBase64(sha512)}`, shasum: toHex(sha1), sha256: toHex(sha256) };
}
