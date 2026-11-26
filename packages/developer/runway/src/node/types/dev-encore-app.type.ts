/**
 * Stackra file contract:
 * Purpose: `DevEncoreApp`, what `syncDevEncoreApp` returns: the app root `encore run` runs in, the members it holds and
 *          how many files the sync wrote and removed.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 3); STA-2840.
 */

/** The local monolith app after a sync. */
export type DevEncoreApp = {
  /** The absolute app root, the repository's `.stackra/dev/encore`. */
  readonly root: string;

  /** The members it holds, relative to the repository (`services/billing`). */
  readonly members: readonly string[];

  /** How many files the sync wrote (unchanged files are not rewritten). */
  readonly written: number;

  /** How many files and member folders the sync removed. */
  readonly removed: number;
};
