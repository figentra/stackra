/**
 * Stackra file contract:
 * Purpose: `BASELINE_FILE`, the committed `no-explicit-any` disable baseline of `stackra any-ratchet`, repository-relative:
 *          package directory to its allowed count (a package not listed has a baseline of 0).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: rule-gap list N-5 (owner D11, 2026-10-28); STA-1388.
 */

/** The baseline file the `any` ratchet reads. */
export const BASELINE_FILE = "tools/scripts/any-ratchet.baseline.yaml";
