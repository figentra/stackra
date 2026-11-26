/**
 * Stackra file contract:
 * Purpose: `UpgradeFileEdit`, one file `stackra upgrade` changes: its text before and after, and what changed it (the
 *          version bump or the codemod ids).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */

/** A file's change. */
export type UpgradeFileEdit = {
  /** The file, relative to the workspace root, with `/` separators. */
  readonly file: string;

  /** The text before. */
  readonly before: string;

  /** The text after. */
  readonly after: string;

  /** `versions` for a pin bump, else the codemod ids that changed it, in order. */
  readonly by: readonly string[];
};
