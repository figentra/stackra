/**
 * Stackra file contract:
 * Purpose: `RawFinding`, a repository check's finding in the text form the `tools/scripts` gates have always printed:
 *          the rule that produced it, the member directory it is about ("" for the repository) and its text, which
 *          usually starts with `path:` or `path:line:`.
 * Boundary: type only; `toFinding` turns one into a `Finding`, and the wrapper scripts print `<dir>: <text>`.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: checks move into the CLI's packages).
 */

/** One finding of a repository check, before it is located. */
export type RawFinding = {
  /** The check that produced it, in kebab case (`test-placement`, `json-configs`, `doc-standard`). */
  readonly rule: string;

  /** The member directory, repository-relative; "" when the text names its own path. */
  readonly dir: string;

  /** The finding as the check wrote it. */
  readonly text: string;
};
