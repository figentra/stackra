/**
 * Stackra file contract:
 * Purpose: `StagedEncoreApp`, what one `stageEncoreApp` run wrote: the folder, the staged services and packages, how
 *          many files had a `#` import rewritten, and the specifiers no `imports` map resolved.
 * Boundary: a type only; the `--json` data of `stackra encore:stage`.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09: multi-service apps, option b).
 */

/** What a staging run wrote. */
export type StagedEncoreApp = {
  /** The staging folder. */
  readonly out: string;
  /** The staged services, by member folder relative to the root. */
  readonly services: readonly string[];
  /** The staged workspace packages, by member folder relative to the root. */
  readonly packages: readonly string[];
  /** How many source files had a `#` import rewritten. */
  readonly rewritten: number;
  /** The `#` specifiers no `imports` map resolved, with their staged file relative to the folder. */
  readonly unresolved: readonly { readonly file: string; readonly specifier: string }[];
};
