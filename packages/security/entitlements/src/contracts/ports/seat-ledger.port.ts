/**
 * Stackra file contract:
 * Purpose: the `SeatLedger` port: who holds which seat kind in which scope: count, list, assign and release.
 * Boundary: an abstract class that is its own token, implemented by the service that owns seats (OS entitlements) or
 *           the memory driver. It stores and counts; the allowance check is `SeatMeterService`'s, under a lock, so the
 *           ledger never decides. Assigning a seat a principal already holds is a no-op.
 * Runtime: isomorphic
 * Governing contract: ADR 0242 (decision 2); owner XP-1 (seat kinds); owner round 3 #18 (no race at the limit).
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { SeatAssignment } from "#contracts/types/seat-assignment.type";

/**
 * Keeps seat assignments.
 *
 * @example
 * const held = await ledger.count(scope, "provider");
 */
export abstract class SeatLedger extends Port {
  /** How many principals hold a seat of `seatKind` in `scope`. */
  abstract count(scope: PublicId | undefined, seatKind: string): Promise<number>;

  /** The seats held in `scope`, every kind. */
  abstract list(scope: PublicId | undefined): Promise<readonly SeatAssignment[]>;

  /** Records `assignment`; nothing changes when the principal already holds that kind there. */
  abstract assign(assignment: SeatAssignment): Promise<void>;

  /** Frees the seat of `seatKind` `principal` holds in `scope`; `false` when it held none. */
  abstract release(
    scope: PublicId | undefined,
    principal: PublicId,
    seatKind: string,
  ): Promise<boolean>;
}
