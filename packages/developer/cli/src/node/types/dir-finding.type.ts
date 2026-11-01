/**
 * Stackra file contract:
 * Purpose: `DirFinding`, one repository finding as the moved `tools/scripts` checks report it: the member folder and
 *          the text, printed as `<dir>: <text>` (the shape @stackra/repo-checks reports, without its rule name).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the repository scripts move into the CLI).
 */

/** One finding of a repository check. */
export type DirFinding = {
  /** The member folder or file it is about, repository-relative. */
  readonly dir: string;

  /** The finding, one line. */
  readonly text: string;
};
