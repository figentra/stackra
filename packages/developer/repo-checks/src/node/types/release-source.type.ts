/**
 * Stackra file contract:
 * Purpose: `ReleaseSource`, one file the release-note check reads: a `CHANGELOG.md` or a pending `.changeset/*.md`.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0013 (decision 5); STA-2835.
 */

/** A file and its text. */
export type ReleaseSource = {
  /** The repository-relative path. */
  readonly path: string;

  /** The file's text. */
  readonly text: string;
};
