/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_LABELS`, the upper-case word each step status shows in the markdown summary.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** Status to label. */
export const CONSUMER_GATE_LABELS = {
  pass: "PASS",
  allowed: "ALLOWED",
  fail: "FAIL",
  skipped: "SKIPPED",
} as const;
