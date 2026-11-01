/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_NEVER_ALLOW_CLASSES`, the classes that can never be excused (security, tenant isolation,
 *          data integrity and the pack-mode `leak` step): an allow entry with one is refused and the run exits 2.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813; Flow spec STA-1815.
 */

/** The classes the loader refuses: such a failure fixes the train, it is never excused. */
export const CONSUMER_GATE_NEVER_ALLOW_CLASSES: readonly string[] = [
  "security",
  "tenant-isolation",
  "data-integrity",
  "leak",
];
