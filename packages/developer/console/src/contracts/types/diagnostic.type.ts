/**
 * Stackra file contract:
 * Purpose: `Diagnostic`, the one shape of a finding a command or tool reports: the phase that found it, its code, how
 *          bad it is, where it is, what is wrong, the fix and the docs link. A failed test, a type error, a lint
 *          finding, a gen refusal, a `stackra check` finding and a command's own error all arrive in it, so an agent
 *          reads one list instead of a tool's printed output.
 * Boundary: a type only. `code` is the code as `stackra explain` takes it (gen's `shape_number_kind`, a check finding's
 *           `<tool>/<rule>`, TypeScript's `TS2322`), and `docsUrl` is the link `stackra explain` gives for that code,
 *           or one the tool printed; neither is invented for a code the error-code reference does not list.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 5: run gen, validate and verify and explain failures); ADR 0231 (snake_case
 *                     machine codes); ADR 0294 (decision 26: refusals print their fix); STA-2886.
 */

/** One finding, as a person or an agent acts on it. */
export interface Diagnostic {
  /** The step that found it: a `stackra check` phase (`lint`, `structure`) or the tool that ran (`test`, `gen`). */
  readonly phase: string;

  /** The machine code as `stackra explain` takes it (`shape_number_kind`, `repo-checks/imports`, `TS2322`). */
  readonly code?: string;

  /** `error` fails the run; `warning` is reported and never fails it. */
  readonly severity: "error" | "warning";

  /** The file, from the repository root, when the finding is about one. */
  readonly file?: string;

  /** The 1-based line, when the tool gave one. */
  readonly line?: number;

  /** The 1-based column, when the tool gave one. */
  readonly column?: number;

  /** What is wrong, in the tool's words. */
  readonly message: string;

  /** What to do about it: the tool's own fix, or the command that repairs it. */
  readonly fix?: string;

  /** Where the docs explain the code: the error-code reference entry `stackra explain` links, or the tool's own. */
  readonly docsUrl?: string;
}
