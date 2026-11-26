/**
 * Stackra file contract:
 * Purpose: `ReleaseNote`, one note `stackra upgrade-notes` judges: a pending changeset that bumps an `@stackra/*`
 *          package, or an `@stackra/*` changelog entry of a release from `UPGRADE_NOTES_FLOOR` on.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (Enforcement); STA-145.
 */

/** A changeset or a changelog entry. */
export type ReleaseNote = {
  /** The file it was read from, relative to the repository root. */
  readonly file: string;

  /** `changeset` for a pending `.changeset/<name>.md`, `changelog` for a released entry. */
  readonly kind: "changeset" | "changelog";

  /** The changeset's name, or the entry's short commit hash. */
  readonly ref: string;

  /** The release that carried a changelog entry; absent for a pending changeset. */
  readonly version?: string;

  /** The note's text, its changelog indentation removed. */
  readonly text: string;
};
