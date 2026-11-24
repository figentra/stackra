/**
 * Stackra file contract:
 * Purpose: `paymentLocksOf`, the `Locks` a test passes to `PaymentService`: the real lock service over the memory lock
 *          driver and the test's own clock.
 * Boundary: test support from `./testing`; never bound in production, where the host's lock driver serves `Locks`.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (fakes in ./testing); ADR 0149 (decision 2).
 */
import type { Clock } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";

/**
 * The locks of one test.
 *
 * @param clock - the clock the service under test reads, so a lease and a record share one time.
 * @example
 * const payments = new PaymentService(gateways, records, clock, limits, paymentLocksOf(clock));
 */
export function paymentLocksOf(clock: Clock): Locks {
  return new Locks(new MemoryLockDriver(clock), clock);
}
