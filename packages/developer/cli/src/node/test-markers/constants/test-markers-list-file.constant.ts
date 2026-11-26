/**
 * Stackra file contract:
 * Purpose: `TEST_MARKERS_LIST_FILE`, the committed review list of every test that does not always run: each
 *          environment gate (`skipIf` / `runIf`) with its reason, and each quarantined test (`skip`, `todo`, `fixme`,
 *          `fails`, or a flaky gate) with its Linear issue, reason and end date.
 * Boundary: data only; a repository-relative path.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4, the flaky-test quarantine); STA-2842.
 */

/** The review list the test markers are checked against. */
export const TEST_MARKERS_LIST_FILE = "tools/scripts/test-markers.yaml";
