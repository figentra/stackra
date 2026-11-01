/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_STEPS`, the step names of `stackra consumer-gate` in run order; a matrix `steps` list and
 *          `--steps` may name only these.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The steps, in order. `leak` runs only in pack mode and is never allow-listed. */
export const CONSUMER_GATE_STEPS: readonly string[] = [
  "install",
  "leak",
  "build-deps",
  "gen",
  "typecheck",
  "lint",
  "build",
  "test",
  "test:int",
  "format",
  "spell",
  "validate",
];
