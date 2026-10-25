/**
 * Stackra file contract:
 * Purpose: `ROLLBACK_ENVIRONMENTS`, the environments whose database `stackra db rollback` may revert: dev, preview
 *          and test. Staging and production roll forward.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0159 (2026-10-23 and 2026-10-24 notes: rollback on dev, preview and test databases only).
 */

/** The environments a rollback may run in. */
export const ROLLBACK_ENVIRONMENTS: readonly string[] = ["dev", "preview", "test"];
