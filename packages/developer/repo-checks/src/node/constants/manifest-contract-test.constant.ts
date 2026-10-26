/**
 * Stackra file contract:
 * Purpose: `MANIFEST_CONTRACT_TEST`, the documented exception for the member manifest contract test: not required until M2.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0182; settlement L7.
 */

/**
 * Documented exception: `required: false` on the manifest test exempts every member until M2 (gen does not exist before
 * W6; settlement L7 and plan section 4).
 */
export const MANIFEST_CONTRACT_TEST = Object.freeze({
  file: "app-manifest.contract.test.ts",
  tier: "contract",
  required: false,
  until: "M2",
  reason: "gen does not exist before W6; flip required to true at M2",
  adr: "0182",
});
