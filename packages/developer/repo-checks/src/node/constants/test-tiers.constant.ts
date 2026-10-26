/**
 * Stackra file contract:
 * Purpose: `TEST_TIERS`, the test tiers and the infix each one puts before `.ts`.
 * Boundary: data only; `testFileFor` reads it. `e2e` tests live in the app, not in a member.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0182 (decision 1).
 */

/** Test tiers and the infix each one puts before `.ts` (ADR 0022, ADR 0182 d1). */
export const TEST_TIERS = Object.freeze([
  { name: "unit", infix: ".test", reason: "fast, no external services", adr: "0182" },
  { name: "int", infix: ".int.test", reason: "needs a real database or container", adr: "0182" },
  {
    name: "contract",
    infix: ".contract.test",
    reason: "checks a declared contract, such as the manifest",
    adr: "0182",
  },
  {
    name: "load",
    infix: ".load.test",
    reason: "k6 load tests, run weekly against staging",
    adr: "0182",
  },
  { name: "e2e", infix: ".e2e.test", reason: "runs a whole app", adr: "0022" },
]);
