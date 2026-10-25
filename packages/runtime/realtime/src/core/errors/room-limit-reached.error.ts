/**
 * Stackra file contract:
 * Purpose: `RoomLimitReachedError` (`room_limit_reached`), the refusal of a room member over a cap: the room is full,
 *          a message is too large, or the member sends faster than the rate allows. The member is dropped with it,
 *          never silently (ADR 0346 decision 6).
 * Boundary: kind `RateLimited` (429), retryable: a full room or a rate frees up. No details: nothing about the room or
 *           its members travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decision 6); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A room's cap was reached.
 *
 * @example
 * throw RoomLimitReachedError.create();
 */
export class RoomLimitReachedError extends Refusal({
  kind: ErrorKind.RateLimited,
  retryable: true,
}) {}
