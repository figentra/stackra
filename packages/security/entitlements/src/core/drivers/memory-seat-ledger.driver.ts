/**
 * Stackra file contract:
 * Purpose: `MemorySeatLedgerDriver`, a `SeatLedger` held in memory, for tests and local runs.
 * Boundary: process-local and unsynchronised; never a production store. Assigning a held seat is a no-op.
 * Runtime: isomorphic
 * Governing contract: ADR 0242 (decision 2); owner XP-1; ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { SeatLedger } from "#contracts/ports/seat-ledger.port";
import type { SeatAssignment } from "#contracts/types/seat-assignment.type";

/** Whether `a` is the seat of `scope`, `principal` and `seatKind`. */
const isSeat = (
  a: SeatAssignment,
  scope: PublicId | undefined,
  principal: PublicId,
  seatKind: string,
): boolean => a.scope === scope && a.principal === principal && a.seatKind === seatKind;

/**
 * Seats held in memory.
 *
 * @example
 * await ledger.assign({ principal: rana.id, seatKind: "provider", scope: venue.id, since: now });
 */
export class MemorySeatLedgerDriver extends Driver(SeatLedger) {
  /** Every held seat. */
  private seats: readonly SeatAssignment[] = [];

  /** How many hold `seatKind` in `scope`. */
  count(scope: PublicId | undefined, seatKind: string): Promise<number> {
    return Promise.resolve(
      this.seats.filter((seat) => seat.scope === scope && seat.seatKind === seatKind).length,
    );
  }

  /** The seats of `scope`. */
  list(scope: PublicId | undefined): Promise<readonly SeatAssignment[]> {
    return Promise.resolve(this.seats.filter((seat) => seat.scope === scope));
  }

  /** Records `assignment` unless it is already held. */
  assign(assignment: SeatAssignment): Promise<void> {
    const { scope, principal, seatKind } = assignment;
    if (!this.seats.some((seat) => isSeat(seat, scope, principal, seatKind)))
      this.seats = [...this.seats, Object.freeze({ ...assignment })];
    return Promise.resolve();
  }

  /** Frees one seat; `false` when it was not held. */
  release(scope: PublicId | undefined, principal: PublicId, seatKind: string): Promise<boolean> {
    const before = this.seats.length;
    this.seats = this.seats.filter((seat) => !isSeat(seat, scope, principal, seatKind));
    return Promise.resolve(this.seats.length < before);
  }
}
