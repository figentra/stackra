/**
 * Stackra file contract:
 * Purpose: the system driver of the `Clock` port: the container's default when nothing else binds `Clock`, so every
 *          member injects `Clock` with no driver of its own.
 * Boundary: reads the host clock through `new Date()`, which `freezeClock` from @stackra/testing fixes in a test; an
 *           override, a candidate or `@Replaces(Clock)` wins over it. Not exported: a host replaces it, never names it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17); ADR 0269 (time is faked in tests).
 */
import { Clock } from "@stackra/contracts";

import { Driver } from "#core/bases/driver.base";

/** Tells the time from the host clock. */
export class SystemClockDriver extends Driver(Clock) {
  /** The current instant, as a new `Date`. */
  now(): Date {
    return new Date();
  }
}
