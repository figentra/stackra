/**
 * Stackra file contract:
 * Purpose: `StaffPinRejectedError`, a staff PIN that does not match on this device (`staff_pin_rejected`).
 * Boundary: kind `Unauthenticated`, retryable true. It never names another person or what a record holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8); owner round 3 #15; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal for a staff PIN that does not match on this device.
 *
 * @example
 * throw StaffPinRejectedError.create();
 */
export class StaffPinRejectedError extends Refusal({
  kind: ErrorKind.Unauthenticated,
  retryable: true,
}) {}
