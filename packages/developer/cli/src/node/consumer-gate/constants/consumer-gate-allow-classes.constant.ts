/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_ALLOW_CLASSES`, the `class` an allow-list entry must carry: the classes a failure may be
 *          excused under (the refused classes are `CONSUMER_GATE_NEVER_ALLOW_CLASSES`).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813; Flow spec STA-1815.
 */

/** The classes an entry may use. */
export const CONSUMER_GATE_ALLOW_CLASSES: readonly string[] = [
  "product",
  "flaky",
  "environment",
  "known-core",
];
