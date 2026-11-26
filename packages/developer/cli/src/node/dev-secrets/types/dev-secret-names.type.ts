/**
 * Stackra file contract:
 * Purpose: `DevSecretNames`, the secret names dev needs, sorted by what `stackra dev secrets init` does with each.
 * Boundary: type only; names, never values.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2679.
 */

/** The dev secret names of a workspace, each sorted and in one list only. */
export type DevSecretNames = {
  /** Required names init generates a random value for. */
  readonly generate: readonly string[];

  /** Required names a random value would break (a connection string, a key pair): someone sets them. */
  readonly needsValue: readonly string[];

  /** Names the configuration does not require; left unset, so its default or fallback runs. */
  readonly optional: readonly string[];
};
