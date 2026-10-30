/**
 * Stackra file contract:
 * Purpose: `SpecFindingsOptions`, what `specFindings` needs: the base ref, the branch and the injected git, file and listing access.
 * Boundary: type only; every I/O is a function the caller supplies, so the check is testable.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/** The input of `specFindings`. */
export type SpecFindingsOptions = {
  /** The base ref the diff and the commit range start at (`origin/main`). */
  readonly base: string;

  /** The current branch name; `""` when unknown. */
  readonly branch: string;

  /** True on a ready-for-review PR: the PR's own spec must then be at Tasked or later. */
  readonly requireReady: boolean;

  /** Runs `git <args>` in the repository and returns its stdout, or `null` when it fails. */
  readonly git: (args: readonly string[]) => string | null;

  /** True when the repository-relative path exists. */
  readonly exists: (path: string) => boolean;

  /** The text of a repository-relative file, or `undefined` when it is absent. */
  readonly read: (path: string) => string | undefined;

  /** The entry names of a repository-relative folder; empty when it is absent. */
  readonly list: (path: string) => readonly string[];
};
