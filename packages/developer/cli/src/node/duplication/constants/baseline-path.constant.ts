/**
 * Stackra file contract:
 * Purpose: `BASELINE_PATH`, the per-member copy-paste baseline of `stackra duplication`, repository-relative.
 *          Repo-owned data is YAML (the YAML standard).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code).
 */

/** The baseline file the duplication ratchet reads and `--update` rewrites. */
export const BASELINE_PATH = "tools/scripts/duplication-baseline.yaml";
