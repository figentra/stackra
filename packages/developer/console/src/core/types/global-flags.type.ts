/**
 * Stackra file contract:
 * Purpose: `GlobalFlags`, the global options of one invocation after parsing.
 * Boundary: a type only; `ansi` is undefined unless `--ansi` or `--no-ansi` was given.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-015.
 */

/** The global options as given. */
export interface GlobalFlags {
  /** True with `-h` or `--help`. */
  readonly help: boolean;

  /** True with `-V` or `--version`. */
  readonly version: boolean;

  /** True with `-v` or `--verbose`. */
  readonly verbose: boolean;

  /** True with `-q` or `--quiet`. */
  readonly quiet: boolean;

  /** False with `-n` or `--no-interaction`. */
  readonly interaction: boolean;

  /** True with `--json`. */
  readonly json: boolean;

  /** True with `--ansi`, false with `--no-ansi`. */
  readonly ansi: boolean | undefined;
}
