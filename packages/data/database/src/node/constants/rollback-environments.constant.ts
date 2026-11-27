/**
 * Stackra file contract:
 * Purpose: `ROLLBACK_ENVIRONMENTS`, the environments `stackra db rollback` may revert in: dev, preview and test. Every
 *          other environment rolls forward only, and there `stackra db migrate` holds contract steps to their release
 *          gate.
 * Boundary: a frozen set read by `rollback` (the refusal) and `migrate` (whether it sets the release gate's setting).
 * Runtime: node
 * Governing contract: ADR 0159 (2026-10-23 and 2026-10-24 notes: rollback on dev, preview and test only; decision 3).
 */

/** The environments a rollback may run in. */
export const ROLLBACK_ENVIRONMENTS: ReadonlySet<string> = new Set(["dev", "preview", "test"]);
