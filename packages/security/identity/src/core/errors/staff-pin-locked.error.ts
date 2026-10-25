/**
 * Stackra file contract:
 * Purpose: `StaffPinLockedError`, too many wrong PINs on this device for this staff member (`staff_pin_locked`); attempts are refused until
 *          the lockout ends.
 * Boundary: kind `RateLimited`, retryable true. It never names another person or what a record holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8); owner round 3 #15; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal.
 *
 * @example
 * throw StaffPinLockedError.create();
 */
export class StaffPinLockedError extends Refusal({
  kind: ErrorKind.RateLimited,
  retryable: true,
}) {}
