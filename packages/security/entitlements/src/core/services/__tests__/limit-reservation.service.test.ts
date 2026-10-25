/**
 * Stackra file contract:
 * Purpose: unit tests of `LimitReservationService`: a create below the limit runs; two creates racing at the last slot
 *          let exactly one through (reserve-then-commit under the lock); a limit outside the plan refuses
 *          `entitlement_required`; a feature is not a limit.
 * Boundary: test only; real `Locks` over `MemoryLockDriver`, a fixed clock, a usage counter over an in-memory list
 *           that the create appends to.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0215 (decisions 3 and 4); owner round 3 #18.
 */
import { type AnyClass, Driver } from "@stackra/container";
import { Clock, type PublicId } from "@stackra/contracts";
import { EntitlementRequiredError } from "@stackra/errors";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { EntitlementUsage } from "#contracts/ports/entitlement-usage.port";
import { Entitlement } from "#core/bases/entitlement.base";
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { LimitReachedError } from "#core/errors/limit-reached.error";
import { registerEntitlements } from "#core/functions/register-entitlements.function";
import { LimitReservationService } from "#core/services/limit-reservation.service";
import { fakeEntitlements } from "#testing/functions/fake-entitlements.function";

class Product {}

class ProductLimitEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => Product,
}) {}

class ReportsEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

/** The real time, so lock waits progress. */
class SystemClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date();
  }
}

/** Counts the rows the creates appended. */
class RowsUsageDriver extends Driver(EntitlementUsage) {
  rows: (PublicId | undefined)[] = [];

  async count(_model: AnyClass, scope: PublicId | undefined): Promise<number> {
    return this.rows.filter((row) => row === scope).length;
  }
}

const ACME = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1";

describe("LimitReservationService", () => {
  let usage: RowsUsageDriver;
  let locks: Locks;

  beforeEach(() => {
    ENTITLEMENT_REGISTRY.clear();
    registerEntitlements([
      { type: ProductLimitEntitlement, key: "catalogue.product_limit", gates: [] },
      { type: ReportsEntitlement, key: "reports.reports", gates: [] },
    ]);
    usage = new RowsUsageDriver();
    const clock = new SystemClockDriver();
    locks = new Locks(new MemoryLockDriver(clock), clock);
  });

  /** A create that takes a tick before its row becomes countable. */
  const create = async (): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    usage.rows.push(ACME);
    return "created";
  };

  it("lets exactly one of two racing creates take the last slot", async () => {
    const service = new LimitReservationService(
      fakeEntitlements([[ProductLimitEntitlement, 2]]),
      usage,
      locks,
      new SystemClockDriver(),
    );
    usage.rows = [ACME];
    const results = await Promise.allSettled([
      service.reserve(ProductLimitEntitlement, ACME, create),
      service.reserve(ProductLimitEntitlement, ACME, create),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const refused = results.find((result) => result.status === "rejected");
    expect((refused as PromiseRejectedResult).reason).toBeInstanceOf(LimitReachedError);
    expect(usage.rows).toHaveLength(2);
  });

  it("refuses a limit outside the plan and a feature that is not a limit", async () => {
    const service = new LimitReservationService(
      fakeEntitlements(),
      usage,
      locks,
      new SystemClockDriver(),
    );
    await expect(service.reserve(ProductLimitEntitlement, ACME, create)).rejects.toBeInstanceOf(
      EntitlementRequiredError,
    );
    expect(() => service.reserve(ReportsEntitlement, ACME, create)).toThrow(TypeError);
  });
});
