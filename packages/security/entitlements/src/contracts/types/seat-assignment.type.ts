/**
 * Stackra file contract:
 * Purpose: `SeatAssignment`, one principal holding one seat of one kind in one scope since a time.
 * Boundary: a type only. A principal may hold seats of several kinds; whether a PIN-only principal is a seat at all is
 *           the product's catalogue choice (ADR 0361 decision 8), so this package counts what it is told to.
 * Runtime: isomorphic
 * Governing contract: ADR 0242 (decision 2); ADR 0361 (decision 8); owner XP-1.
 */
import type { PublicId } from "@stackra/contracts";

/** One held seat. */
export interface SeatAssignment {
  /** The principal holding the seat. */
  readonly principal: PublicId;

  /** The seat kind's key from the plan catalogue. */
  readonly seatKind: string;

  /** The scope node the seat is counted in; `undefined` platform-wide. */
  readonly scope: PublicId | undefined;

  /** When the seat was assigned. */
  readonly since: Date;
}
