/**
 * Stackra file contract:
 * Purpose: `COVERAGE_THRESHOLDS`, the floor every package meets: lines and functions 80, branches 70.
 * Boundary: a frozen value; a threshold moves only upward, in a changeset.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0007 (documentation).
 */
/** Lines/functions 80, branches 70 — the floor every package meets. */
export const COVERAGE_THRESHOLDS = Object.freeze({ lines: 80, functions: 80, branches: 70 });
