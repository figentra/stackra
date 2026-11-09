/**
 * Stackra file contract:
 * Purpose: proves `ServicePlanSnapshotsDriver` reads real plans and fails closed: it decodes the plan service's answer
 *          (a count, no limit as `Infinity`, a soft limit's grace end, seats without flags, the paid-since date),
 *          caches it for `maxAgeSeconds`, reads a version-0 answer as no plan, and reads a failed call or an answer for
 *          another scope as no plan without caching it.
 * Boundary: unit tier; a scripted `PlanServiceChannel` and a settable clock, no network.
 * Runtime: node
 * Governing contract: ADR 0215 (decisions 5 and 6); ADR 0260 (decision 6).
 */
import { Driver } from "@stackra/container";
import { Clock, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PlanServiceChannel } from "#contracts/ports/plan-service-channel.port";
import type { PlanSnapshotWire } from "#contracts/types/plan-snapshot-wire.type";
import { ServicePlanSnapshotsDriver } from "#core/drivers/service-plan-snapshots.driver";

/** The asked scope. */
const ACME = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1" as PublicId;

/** Another scope, which an answer must never be trusted for. */
const OTHER = "scp_01j9z3k4m5n6p7q8r9s0t1v2w2" as PublicId;

/** The plan service's answer for ACME. */
const VIEW: PlanSnapshotWire = {
  version: 3,
  maxAgeSeconds: 60,
  scopeId: ACME,
  grants: {
    "catalogue.product_limit": 50,
    "storage.gb": null,
    reports: true,
    seats: { limit: 3, graceEndsAt: "2026-11-15T00:00:00.000Z" },
  },
  seats: { full: 3, light: { limit: 0 }, viewer: false },
  paidSince: "2026-10-01T00:00:00.000Z",
};

/** A clock the test moves. */
class SteppedClockDriver extends Driver(Clock) {
  /** The current time. */
  at = new Date("2026-11-01T09:00:00Z");

  /** The current time. */
  now(): Date {
    return this.at;
  }
}

/** Answers each read from a script and counts the reads. */
class ScriptedPlanServiceChannelDriver extends Driver(PlanServiceChannel) {
  /** Reads made. */
  reads = 0;

  /**
   * @param answer - what the next read resolves, or rejects with when it is an Error.
   */
  constructor(public answer: PlanSnapshotWire | Error) {
    super();
  }

  /** Counts the read and answers it. */
  snapshot(): Promise<PlanSnapshotWire> {
    this.reads += 1;
    return this.answer instanceof Error
      ? Promise.reject(this.answer)
      : Promise.resolve(this.answer);
  }
}

/** Guards that a product reads the tenant's actual plan and never more than it. */
describe(ServicePlanSnapshotsDriver, () => {
  /** One call for two reads within the minute; the answer decoded into the port's form. */
  it("decodes the plan and caches it for its max age", async () => {
    const clock = new SteppedClockDriver();
    const channel = new ScriptedPlanServiceChannelDriver(VIEW);
    const driver = new ServicePlanSnapshotsDriver(channel, clock);

    const plan = await driver.read(ACME);
    await driver.read(ACME);

    expect(channel.reads).toBe(1);
    expect(plan).toEqual({
      version: 3,
      grants: {
        "catalogue.product_limit": 50,
        "storage.gb": Number.POSITIVE_INFINITY,
        reports: true,
        seats: { limit: 3, graceEndsAt: new Date("2026-11-15T00:00:00.000Z") },
      },
      seats: { full: 3, light: { limit: 0 } },
      paidSince: new Date("2026-10-01T00:00:00.000Z"),
    });

    clock.at = new Date("2026-11-01T09:01:01Z");
    await driver.read(ACME);
    expect(channel.reads).toBe(2);
  });

  /** A scope the plan service holds no plan for, and the platform-wide read, are no plan. */
  it("reads version 0 and the platform-wide read as no plan", async () => {
    const channel = new ScriptedPlanServiceChannelDriver({ ...VIEW, version: 0 });
    const driver = new ServicePlanSnapshotsDriver(channel, new SteppedClockDriver());

    expect(await driver.read(ACME)).toBeUndefined();
    expect(await driver.read(undefined)).toBeUndefined();
    expect(channel.reads).toBe(1);
  });

  /** A failed call refuses every right and asks again next time. */
  it("fails closed when the call fails, without caching", async () => {
    const channel = new ScriptedPlanServiceChannelDriver(new TypeError("unreachable"));
    const driver = new ServicePlanSnapshotsDriver(channel, new SteppedClockDriver());

    expect(await driver.read(ACME)).toBeUndefined();
    channel.answer = VIEW;
    expect((await driver.read(ACME))?.version).toBe(3);
    expect(channel.reads).toBe(2);
  });

  /** An answer for another scope is never trusted, nor cached. */
  it("fails closed on an answer for another scope", async () => {
    const channel = new ScriptedPlanServiceChannelDriver({ ...VIEW, scopeId: OTHER });
    const driver = new ServicePlanSnapshotsDriver(channel, new SteppedClockDriver());

    expect(await driver.read(ACME)).toBeUndefined();
    expect(await driver.read(ACME)).toBeUndefined();
    expect(channel.reads).toBe(2);
  });
});
