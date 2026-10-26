/**
 * Stackra file contract:
 * Purpose: `CheckOptions`, the parsed flags of `stackra check` and its aliases: fix, the affected scope and its base,
 *          the phase selection, the output format and the opt-in test phase.
 * Boundary: type only; `parseCheckOptions` builds it from the command line and an alias's defaults.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the CLI runs every check).
 */

/** The flags of one `stackra check` run. */
export type CheckOptions = {
  /** Apply the fixes each phase can (oxfmt, oxlint autofix, `stackra gen`), then check again. */
  readonly fix: boolean;

  /** Restrict the run to the files changed since `base` (committed, staged, unstaged and untracked). */
  readonly affected: boolean;

  /** The git ref `--affected` and the CI-only checks compare against; `undefined` when not given. */
  readonly base: string | undefined;

  /** The phases to run, in phase order; every phase when `--only` is absent. */
  readonly phases: readonly string[];

  /** How findings print: one text line each, a JSON array, or GitHub annotations. */
  readonly format: "text" | "json" | "github";

  /** True runs the opt-in `test` phase. */
  readonly withTests: boolean;
};
