/**
 * Stackra file contract:
 * Purpose: `ShellRef`, the shell a surface runs in, parsed from the root runway's `surfaces.<surface>.shell`
 *          (`os/console@3`): the repository that owns it, the shell's name and the version line it targets.
 * Boundary: type only; `parseShellRef` builds it.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4 to 6: `targets: console@N`, one version line); app-shells section 8.2.
 */

/** One shell reference, `<owner>/<name>@<line>`. */
export type ShellRef = {
  /** The repository that ships the shell (`os`, `commerce`). */
  readonly owner: string;

  /** The shell's name (`console`, `till`), also its app folder in that repository (`apps/<name>`). */
  readonly name: string;

  /** The major version line the surface targets (`3` in `console@3`). */
  readonly line: number;
};
