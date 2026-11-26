/**
 * Stackra file contract:
 * Purpose: `STRICT_COVERAGE_THRESHOLDS`, the higher floor of the packages ADR 0182 holds to more: lines and functions
 *          90, branches 80.
 * Boundary: a frozen value; a threshold moves only upward, in a changeset.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 2: coverage floors); ADR 0022 (test placement).
 */
/** Lines/functions 90, branches 80 — the floor of the packages in `STRICT_COVERAGE_PACKAGES`. */
export const STRICT_COVERAGE_THRESHOLDS = Object.freeze({ lines: 90, functions: 90, branches: 80 });
