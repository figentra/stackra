/**
 * Stackra file contract:
 * Purpose: `isAffected(path, files)`, whether a finding at `path` concerns the affected files: the file itself, a folder
 *          holding one of them (a member-level finding), or the repository (`.`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */

/**
 * True when a finding at `path` is in scope for an `--affected` run over `files`.
 *
 * @param path - the finding's repository-relative path, `.` for the repository.
 * @param files - the affected files.
 * @example
 * isAffected("packages/x", ["packages/x/src/a.ts"]); // true
 */
export function isAffected(path: string, files: readonly string[]): boolean {
  return path === "." || files.some((file) => file === path || file.startsWith(`${path}/`));
}
