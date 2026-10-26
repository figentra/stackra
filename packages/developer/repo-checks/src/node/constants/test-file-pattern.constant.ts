/**
 * Stackra file contract:
 * Purpose: `TEST_FILE_PATTERN`, which file names are tests: `.test.` or `.spec.` before a JS or TS extension.
 * Boundary: data only; the test-placement check reports `.spec` separately.
 * Runtime: node
 * Governing contract: ADR 0022.
 */

/** Test files match `.test.` or `.spec.` (the validator checks `.spec` separately). */
export const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/;
