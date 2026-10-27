/**
 * Stackra file contract:
 * Purpose: `TarballContents`: what the publish checks need from a tarball.
 * Boundary: reads bytes only; keeps no file body but package.json. Throws `TarballError` on a malformed archive, a
 *           missing package.json or an unpacked size over the limit.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 7).
 */

/** What the publish checks need from a tarball. */
export interface TarballContents {
  /** Paths relative to the archive's top folder, files only. */
  readonly files: readonly string[];
  readonly packageJson: Readonly<Record<string, unknown>>;
}
