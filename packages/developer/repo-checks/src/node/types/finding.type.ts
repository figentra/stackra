/**
 * Stackra file contract:
 * Purpose: `Finding`, one problem `stackra check` reports: the phase and tool that found it, the rule id, where it is
 *          and whether an autofix exists. `stackra check --format json` prints an array of these for agents.
 * Boundary: type only; the CLI builds findings from tool output and from `RawFinding`s with `toFinding`.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the CLI runs every check); ADR 0129 (rules name their ADR).
 */

/** One problem a check phase found. */
export type Finding = {
  /** The `stackra check` phase that ran the check (`config`, `structure`, `lint`, …). */
  readonly phase: string;

  /** The tool or check family that reported it (`repo-checks`, `oxlint`, `cspell`, …). */
  readonly tool: string;

  /** The rule id inside that tool (`test-placement`, `eslint(no-debugger)`, …). */
  readonly rule: string;

  /** The repository-relative path it is about; `.` for the repository itself. */
  readonly path: string;

  /** The 1-based line, or `null` when the finding is about the whole file. */
  readonly line: number | null;

  /** The 1-based column, or `null` when the tool gives none. */
  readonly column: number | null;

  /** What is wrong and, where the check says, what to do. */
  readonly message: string;

  /** `error` fails the run; `warning` is printed and counted but never fails it. */
  readonly severity: "error" | "warning";

  /** True when `stackra check --fix` repairs it. */
  readonly fixable: boolean;

  /** The governing ADR number (`0022`), or `null` when the check names none. */
  readonly adr: string | null;
};
