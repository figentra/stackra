/**
 * Stackra file contract:
 * Purpose: `PlanDevSecretsInput`, what one `stackra dev secrets init` starts from.
 * Boundary: type only. `existing` and `from` hold values and never leave the command except into the file.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2679.
 */

/** The input of `planDevSecrets`. */
export type PlanDevSecretsInput = {
  /** The names init generates (`classifyDevSecrets(...).generate`). */
  readonly generate: readonly string[];

  /** The file's current values, or undefined when there is no file. */
  readonly existing?: Readonly<Record<string, string>>;

  /** Another repository's file, whose matching names are copied. */
  readonly from?: Readonly<Record<string, string>>;

  /** Regenerate every generated name. */
  readonly rotate?: boolean;

  /** A new random value. */
  readonly random: () => string;
};
