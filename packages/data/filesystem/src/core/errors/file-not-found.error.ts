/**
 * Stackra file contract:
 * Purpose: `FileNotFoundError`, what a `FileSystem` driver throws when `read` or `stat` finds nothing under a key.
 * Boundary: a plain `Error`, not a refusal: a disk sits below the action pipeline, and the caller decides whether a
 *           missing file is a `NotFoundError` for its own caller. Carries the normalised key only, never the disk's
 *           root or bucket.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7); ADR 0231 (error classes end in `Error`).
 */

/** Nothing is stored under a key. */
export class FileNotFoundError extends Error {
  /** The normalised key that was asked for. */
  readonly path: string;

  /** @param path - the normalised key that was asked for. */
  constructor(path: string) {
    super(`No file is stored under "${path}"`);
    this.name = "FileNotFoundError";
    this.path = path;
  }
}
