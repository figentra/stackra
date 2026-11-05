/**
 * Stackra file contract:
 * Purpose: `EnvValueResult`, one name checked by `runway env check --values`: its level, environment, home, the broken
 *          rule and a hash prefix.
 * Boundary: type only; never a value, at most the first eight hex characters of its SHA-256.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */

/** One checked name. */
export type EnvValueResult = {
  readonly level: "error" | "warning";
  readonly environment: string;
  readonly name: string;
  /** `<infisical environment>:<path>`. */
  readonly where: string;
  /** The broken rule, or `undefined` when the value passes. */
  readonly failure?: string;
  /** The first eight hex characters of the value's SHA-256, when there is a value. */
  readonly hash?: string;
};
