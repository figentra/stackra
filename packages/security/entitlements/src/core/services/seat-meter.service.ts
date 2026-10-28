/**
 * Stackra file contract:
 * Purpose: `SeatMeterService`, the seat-kind meter: assigns a principal a seat of a catalogue seat kind when the
 *          scope's plan allows one more of that kind, releases it, and reports the seats held per kind for billing.
 * Boundary: the seat kinds and their allowances are plan-catalogue data (`PlanSnapshot.seats`); no kind is named in
 *           code. An assignment checks and records under one lock per scope and kind, so two assignments racing at the
 *           allowance cannot both pass (owner round 3 #18). A kind outside the plan refuses `entitlement_required`; a
 *           soft allowance follows `limitAllows`. Re-assigning a seat already held passes without counting it twice.
 * Runtime: isomorphic
 * Governing contract: ADR 0242 (decision 2: seats); ADR 0215 (decisions 3 and 4); owner XP-1 (seat kinds per
 *                     product).
 */
import { Service } from "@stackra/container";
import { type Clock, Duration, type PublicId } from "@stackra/contracts";
import { EntitlementRequiredError } from "@stackra/errors";
import type { Locks } from "@stackra/locking";

import type { PlanSnapshots } from "#contracts/ports/plan-snapshots.port";
import type { SeatLedger } from "#contracts/ports/seat-ledger.port";
import { SeatLimitReachedError } from "#core/errors/seat-limit-reached.error";
import { isLimitGrant } from "#core/functions/is-limit-grant.function";
import { limitAllows } from "#core/functions/limit-allows.function";
import { limitOf } from "#core/functions/limit-of.function";

/**
 * Meters seats by kind.
 *
 * @example
 * await seats.assign(venue.id, stylist.id, "provider");
 * await seats.usage(venue.id); // { provider: 4, full: 1 }
 */
export class SeatMeterService extends Service {
  /** The plans. */
  private readonly snapshots: PlanSnapshots;

  /** The seats held. */
  private readonly ledger: SeatLedger;

  /** The lock store. */
  private readonly locks: Locks;

  /** The current time. */
  private readonly clock: Clock;

  /**
   * @param snapshots - each scope's plan, with its seat allowances.
   * @param ledger - the seats held.
   * @param locks - the configured lock store.
   * @param clock - the current time.
   */
  constructor(snapshots: PlanSnapshots, ledger: SeatLedger, locks: Locks, clock: Clock) {
    super();
    this.snapshots = snapshots;
    this.ledger = ledger;
    this.locks = locks;
    this.clock = clock;
  }

  /**
   * Gives `principal` a seat of `seatKind` in `scope`.
   *
   * @throws EntitlementRequiredError when the plan has no such seat kind.
   * @throws SeatLimitReachedError when the allowance is used up.
   * @throws TypeError when the plan's allowance is not a count or a soft limit.
   */
  assign(
    scope: PublicId | undefined,
    principal: PublicId,
    seatKind: string,
    hold: Duration = Duration.seconds(30),
  ): Promise<void> {
    return this.locks.with(`seats:${scope ?? "platform"}:${seatKind}`, hold, async () => {
      const seats = (await this.snapshots.read(scope))?.seats;
      const allowance =
        seats !== undefined && Object.hasOwn(seats, seatKind) ? seats[seatKind] : undefined;
      if (allowance === undefined) throw EntitlementRequiredError.create();
      if (!isLimitGrant(allowance))
        throw new TypeError(`the allowance of seat kind ${seatKind} is not a count`);
      const held = await this.ledger.list(scope);
      if (held.some((seat) => seat.principal === principal && seat.seatKind === seatKind)) return;
      const now = this.clock.now();
      const count = held.filter((seat) => seat.seatKind === seatKind).length;
      if (!limitAllows(allowance, count, now))
        throw SeatLimitReachedError.create({ seatKind, limit: limitOf(allowance) });
      await this.ledger.assign({ principal, seatKind, scope, since: now });
    });
  }

  /** Frees `principal`'s seat of `seatKind` in `scope`; `false` when it held none. */
  release(scope: PublicId | undefined, principal: PublicId, seatKind: string): Promise<boolean> {
    return this.ledger.release(scope, principal, seatKind);
  }

  /** The seats held in `scope` per kind, every kind of the plan listed (zero when none is held). */
  async usage(scope: PublicId | undefined): Promise<Readonly<Record<string, number>>> {
    const kinds = Object.keys((await this.snapshots.read(scope))?.seats ?? {});
    const usage: Record<string, number> = Object.fromEntries(kinds.map((kind) => [kind, 0]));
    for (const seat of await this.ledger.list(scope))
      usage[seat.seatKind] = (usage[seat.seatKind] ?? 0) + 1;
    return Object.freeze(usage);
  }
}
