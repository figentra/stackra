/**
 * Stackra file contract:
 * Purpose: `SeatKind`, one seat kind of a product's plan catalogue (a full seat, a provider seat, a support seat).
 * Boundary: a type only; catalogue data (owner XP-1), never a name in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); ADR 0242 (decision 2); owner XP-1.
 */

/** A seat kind. */
export interface SeatKind {
  /** The seat kind's key (`provider`). */
  readonly key: string;
}
