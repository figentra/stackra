/**
 * Stackra file contract:
 * Purpose: unit tests of `SeatMeterService`: seats of a catalogue kind are assigned up to the plan's allowance and
 *          refused past it; a soft allowance passes during grace; re-assigning a held seat counts once; a kind outside
 *          the plan refuses `entitlement_required`; release frees a seat; usage lists every kind of the plan.
 * Boundary: test only; memory plan and ledger drivers, real `Locks` over `MemoryLockDriver`, a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0242 (decision 2); owner XP-1; owner round 3 #18.
 */
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { EntitlementRequiredError } from "@stackra/errors";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { MemoryPlanSnapshotsDriver } from "#core/drivers/memory-plan-snapshots.driver";
import { MemorySeatLedgerDriver } from "#core/drivers/memory-seat-ledger.driver";
import { SeatLimitReachedError } from "#core/errors/seat-limit-reached.error";
import { SeatMeterService } from "#core/services/seat-meter.service";

/** Always 2026-10-25 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-25T09:00:00Z");
  }
}

const VENUE = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1";
const [RANA, OMAR, LINA] = [
  "usr_01j9z3k4m5n6p7q8r9s0t1v2a1",
  "usr_01j9z3k4m5n6p7q8r9s0t1v2a2",
  "usr_01j9z3k4m5n6p7q8r9s0t1v2a3",
] as const;

describe("SeatMeterService", () => {
  let snapshots: MemoryPlanSnapshotsDriver;
  let seats: SeatMeterService;

  beforeEach(() => {
    const clock = new FixedClockDriver();
    snapshots = new MemoryPlanSnapshotsDriver();
    seats = new SeatMeterService(
      snapshots,
      new MemorySeatLedgerDriver(),
      new Locks(new MemoryLockDriver(clock), clock),
      clock,
    );
  });

  it("assigns up to the allowance of a seat kind and refuses past it", async () => {
    snapshots.load(VENUE, { grants: {}, seats: { provider: 2, full: 1 } });
    await seats.assign(VENUE, RANA, "provider");
    await seats.assign(VENUE, RANA, "provider");
    await seats.assign(VENUE, OMAR, "provider");
    const refused = await seats.assign(VENUE, LINA, "provider").catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(SeatLimitReachedError);
    expect((refused as SeatLimitReachedError).details).toEqual({ seatKind: "provider", limit: 2 });
    expect(await seats.usage(VENUE)).toEqual({ provider: 2, full: 0 });
  });

  it("passes a soft allowance during its grace period", async () => {
    snapshots.load(VENUE, {
      grants: {},
      seats: { provider: { limit: 1, graceEndsAt: new Date("2026-11-01T00:00:00Z") } },
    });
    await seats.assign(VENUE, RANA, "provider");
    await expect(seats.assign(VENUE, OMAR, "provider")).resolves.toBeUndefined();
  });

  it("refuses a seat kind outside the plan, and frees a released seat", async () => {
    snapshots.load(VENUE, { grants: {}, seats: { provider: 1 } });
    await expect(seats.assign(VENUE, RANA, "support")).rejects.toBeInstanceOf(
      EntitlementRequiredError,
    );
    await seats.assign(VENUE, RANA, "provider");
    expect(await seats.release(VENUE, RANA, "provider")).toBe(true);
    expect(await seats.release(VENUE, RANA, "provider")).toBe(false);
    await expect(seats.assign(VENUE, OMAR, "provider")).resolves.toBeUndefined();
  });
});
