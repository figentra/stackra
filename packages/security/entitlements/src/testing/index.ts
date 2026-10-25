/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/entitlements (`fakeEntitlements`) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only; no other package's `./testing` (ADR 0269
 *           decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { fakeEntitlements } from "#testing/functions/fake-entitlements.function";
