/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/realtime (`fakeRealtime` and the `RealtimeFake` it
 *          returns) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only; no other package's `./testing` (ADR 0269
 *           decision 3). `RealtimeFake` is a type here: tests build one through `fakeRealtime`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { fakeRealtime } from "#testing/functions/fake-realtime.function";
export type { RealtimeFake } from "#testing/realtime.fake";
