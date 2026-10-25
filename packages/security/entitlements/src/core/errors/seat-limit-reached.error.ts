/**
 * Stackra file contract:
 * Purpose: `SeatLimitReachedError`, the refusal of a seat assignment past the plan's allowance for that seat kind
 *          (`seat_limit_reached`), with an upgrade path like `LimitReachedError`.
 * Boundary: kind `EntitlementRequired` (HTTP 402), not retryable. Its details name the seat kind and the allowance,
 *           both the caller's own plan.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0215 (decision 3); ADR 0242 (decision 2); owner XP-1.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * No seat of that kind is left.
 *
 * @example
 * throw SeatLimitReachedError.create({ seatKind: "provider", limit: 3 });
 */
export class SeatLimitReachedError extends Refusal({
  kind: ErrorKind.EntitlementRequired,
  retryable: false,
}) {
  /** The seat kind's key. */
  seatKind!: string;

  /** How many seats of that kind the plan allows. */
  limit!: number;
}
