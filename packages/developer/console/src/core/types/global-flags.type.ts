/**
 * Stackra file contract:
 * Purpose: `GlobalFlags`, the global options of one invocation after parsing.
 * Boundary: a type only; `ansi` is undefined unless `--ansi` or `--no-ansi` was given.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-015.
 */

/** The global options as given. */
export interface GlobalFlags {
  /** `-h`, `--help`. */
  readonly help: boolean;

  /** `-V`, `--version`. */
  readonly version: boolean;

  /** `-v`, `--verbose`. */
  readonly verbose: boolean;

  /** `-q`, `--quiet`. */
  readonly quiet: boolean;

  /** False with `-n` or `--no-interaction`. */
  readonly interaction: boolean;

  /** `--json`. */
  readonly json: boolean;

  /** True with `--ansi`, false with `--no-ansi`. */
  readonly ansi: boolean | undefined;
}
