/**
 * Stackra file contract:
 * Purpose: `EnvFinding`, one finding of `runway env check`: its level, the name it is about, where the name is
 *          declared or read, and what is wrong.
 * Boundary: type only; names only, never a value.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */

/** One finding of the names-only environment check. */
export type EnvFinding = {
  /** `error` fails the check; `warning` is printed and passes. */
  readonly level: "error" | "warning";

  /** The variable or secret name (`STRIPE_SECRET_KEY`). */
  readonly name: string;

  /** The file that declares or reads it (`services/api/stackra.manifest.json`). */
  readonly where: string;

  /** What is wrong, with the fix. */
  readonly message: string;
};
