/**
 * Stackra file contract:
 * Purpose: `TarballContents`: what the publish checks need from a tarball.
 * Boundary: reads bytes only; keeps no file body but package.json and the README. Throws `TarballError` on a malformed archive, a
 *           missing package.json or an unpacked size over the limit.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 7).
 */

/** What the publish checks need from a tarball. */
export interface TarballContents {
  /** Paths relative to the archive's top folder, files only. */
  readonly files: readonly string[];
  /** The parsed package.json from the archive's top folder. */
  readonly packageJson: Readonly<Record<string, unknown>>;
  /** The top-level README's text (`README`, `README.md` or `README.markdown`, any case), when there is one. */
  readonly readme?: string;
}
