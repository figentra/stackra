/**
 * Stackra file contract:
 * Purpose: unit tests of `PlanLimitReservationDriver`: a call no limit gates commits as it is; a call a limit gates
 *          commits under the reservation in the call's scope and is refused `limit_reached` (no commit) when full; two
 *          racing creates at the last slot let exactly one through; and the driver runs as the `LimitReservation` of
 *          the real `ActionPipeline`.
 * Boundary: test only; real `LimitReservationService` over `Locks` and `MemoryLockDriver`, the source is
 *           `fakeEntitlements`, the usage a list of rows the commits append to.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0215 (decisions 3 and 4); ADR 0397 (decision 3); owner round 3 item 18; STA-765.
 */
import { Action, ActionPipeline, type Resolver } from "@stackra/actions";
import { AccessControl, type CallDescriptor, LimitReservation } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  ApiArea,
  Clock,
  type PublicId,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { EntitlementUsage } from "#contracts/ports/entitlement-usage.port";
import { Entitlement } from "#core/bases/entitlement.base";
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { PlanLimitReservationDriver } from "#core/drivers/plan-limit-reservation.driver";
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

/** Counts the rows the commits appended. */
class RowsUsageDriver extends Driver(EntitlementUsage) {
  rows: (PublicId | undefined)[] = [];

  async count(_model: AnyClass, scope: PublicId | undefined): Promise<number> {
    return this.rows.filter((row) => row === scope).length;
  }
}

/** The real time, so lock waits progress. */
class SystemClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date();
  }
}

class AllowAllDriver extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

const usage = new RowsUsageDriver();

class CreateProductAction extends Action({ key: "product.create", actors: [ActorKind.User] }) {
  async handle(): Promise<string> {
    usage.rows.push(ACME.id);
    return "created";
  }
}

class RenameProductAction extends Action({ key: "product.rename", actors: [ActorKind.User] }) {
  async handle(): Promise<string> {
    return "renamed";
  }
}

const customer: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };
const ACME: ScopeRef = { id: "scp_1", path: "platform.acme" };

/** The descriptor of a call of `type` in Acme. */
function callOf(type: AnyClass): CallDescriptor {
  return {
    callId: "call_1",
    type,
    kind: "action",
    key: "catalogue.product.create@1",
    actor: customer,
    scope: ACME,
    area: ApiArea.App,
  };
}

/** A commit that takes a tick before its row becomes countable. */
const create = async (): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 5));
  usage.rows.push(ACME.id);
  return "created";
};

describe(PlanLimitReservationDriver, () => {
  let driver: PlanLimitReservationDriver;

  beforeEach(() => {
    ENTITLEMENT_REGISTRY.clear();
    registerEntitlements([
      {
        type: ProductLimitEntitlement,
        key: "catalogue.product_limit",
        gates: [CreateProductAction],
      },
    ]);
    usage.rows = [];
    const clock = new SystemClockDriver();
    driver = new PlanLimitReservationDriver(
      new LimitReservationService(
        fakeEntitlements([[ProductLimitEntitlement, 2]]),
        usage,
        new Locks(new MemoryLockDriver(clock), clock),
        clock,
      ),
    );
  });

  it("commits a call no limit gates as it is, even with the limit full", async () => {
    usage.rows = [ACME.id, ACME.id];
    expect(await driver.reserve(callOf(RenameProductAction), {}, async () => "renamed")).toBe(
      "renamed",
    );
  });

  it("refuses a gated create once the limit is full, without committing", async () => {
    usage.rows = [ACME.id, ACME.id];
    let committed = false;
    await expect(
      driver.reserve(callOf(CreateProductAction), {}, async () => {
        committed = true;
      }),
    ).rejects.toBeInstanceOf(LimitReachedError);
    expect(committed).toBe(false);
  });

  it("lets exactly one of two racing creates take the last slot", async () => {
    usage.rows = [ACME.id];
    const results = await Promise.allSettled([
      driver.reserve(callOf(CreateProductAction), {}, create),
      driver.reserve(callOf(CreateProductAction), {}, create),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(usage.rows).toHaveLength(2);
  });

  it("holds the limit as the real pipeline's LimitReservation", async () => {
    const instances = new Map<AnyClass, object>([
      [AccessControl, new AllowAllDriver()],
      [LimitReservation, driver],
      [CreateProductAction, new CreateProductAction()],
    ]);
    const resolver: Resolver = {
      has: (token) => instances.has(token),
      get: <T extends object>(token: AnyClass<T>) => instances.get(token) as T,
    };
    const pipeline = new ActionPipeline(resolver);
    usage.rows = [ACME.id];
    await expect(
      pipeline.execute(CreateProductAction, {} as never, { actor: customer, scope: ACME }),
    ).resolves.toBe("created");
    await expect(
      pipeline.execute(CreateProductAction, {} as never, { actor: customer, scope: ACME }),
    ).rejects.toBeInstanceOf(LimitReachedError);
  });
});
