/**
 * Stackra file contract:
 * Purpose: `RepoContext`, what every repository check reads: the repository root and its file list (tracked plus
 *          untracked, not ignored), read once by `readRepoContext` and shared by the phases.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */

/** The repository a check runs over. */
export type RepoContext = {
  /** The absolute repository root. */
  readonly root: string;

  /** Every file git lists that exists, repository-relative with forward slashes. */
  readonly files: readonly string[];
};
