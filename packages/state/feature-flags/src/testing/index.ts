/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/feature-flags (`fakeFlags` and the `FlagsFake` it
 *          returns) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./contracts` only; no other package's
 *           `./testing` (ADR 0269 decision 3). `FlagsFake` is a type here: tests build one through `fakeFlags`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export type { FlagsFake } from "#testing/flags.fake";
export { fakeFlags } from "#testing/functions/fake-flags.function";
