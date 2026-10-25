/**
 * Stackra file contract:
 * Purpose: unit tests of `PlanEntitlementCheckDriver`: an ungated call passes without asking the source, a feature or
 *          module outside the plan refuses `entitlement_required`, a limit refuses `limit_reached` once the count
 *          reaches the grant (the template's two-product plan), the grant and the count are asked in the call's
 *          `scope` (platform-wide without one), no limit never counts, a grant of the wrong shape is a bug, and the
 *          driver runs as the entitlement step of the real `ActionPipeline`.
 * Boundary: test only; the source is `fakeEntitlements`, the usage a list of rows, the permission step an allow-all.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0138 (as amended);
 *                     ADR 0215 (decisions 1 and 3).
 */
import { Action, ActionPipeline, Query, type Resolver } from "@stackra/actions";
import { AccessControl, type CallDescriptor, EntitlementCheck } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  ApiArea,
  type PublicId,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import { EntitlementRequiredError } from "@stackra/errors";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Entitlement } from "#core/bases/entitlement.base";
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { PlanEntitlementCheckDriver } from "#core/drivers/plan-entitlement-check.driver";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { LimitReachedError } from "#core/errors/limit-reached.error";
import { registerEntitlements } from "#core/functions/register-entitlements.function";
import { EntitlementSource } from "#core/ports/entitlement-source.port";
import { EntitlementUsage } from "#contracts/ports/entitlement-usage.port";
import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementGrant } from "#core/types/entitlement-grant.type";
import { fakeEntitlements } from "#testing/functions/fake-entitlements.function";

class Product {}

class ProductLimitEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => Product,
}) {}

class ReportsEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

class CreateProductAction extends Action({ key: "product.create", actors: [ActorKind.User] }) {
  async handle(): Promise<string> {
    return "created";
  }
}

class ListReportsQuery extends Query({ key: "report.list", actors: [ActorKind.User] }) {
  async handle(): Promise<readonly string[]> {
    return [];
  }
}

class ListProductsQuery extends Query({ key: "product.list", actors: [ActorKind.User] }) {
  async handle(): Promise<readonly string[]> {
    return [];
  }
}

/** Counts the products the test put in `rows`, per scope. */
class RowsUsageDriver extends Driver(EntitlementUsage) {
  rows: PublicId[] = [];

  counted = 0;

  async count(model: AnyClass, scope: PublicId | undefined): Promise<number> {
    this.counted += 1;
    return model === Product ? this.rows.filter((owner) => owner === scope).length : 0;
  }
}

class AllowAllDriver extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

const customer: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };

/** The scope the calls act in, and another one. */
const ACME: ScopeRef = { id: "scp_1", path: "platform.acme" };
const OTHER: PublicId<"scp"> = "scp_2";

/** The descriptor the pipeline builds for a call of `type`, in `scope` (Acme unless `null`). */
function callOf(type: AnyClass, scope: ScopeRef | null = ACME): CallDescriptor {
  return {
    callId: "call_1",
    type,
    kind: "action",
    key: "catalogue.product.create@1",
    actor: customer,
    ...(scope === null ? {} : { scope }),
    area: ApiArea.App,
  };
}

/** A source that records its questions: the entitlements and the scopes asked for. */
function countingSource(grants: readonly (readonly [EntitlementClass, EntitlementGrant])[]) {
  const fake = fakeEntitlements(grants);
  const asked: EntitlementClass[] = [];
  const scopes: (PublicId | undefined)[] = [];
  const source = Object.assign(Object.create(EntitlementSource.prototype) as EntitlementSource, {
    grant: (entitlement: EntitlementClass, scope: PublicId | undefined) => {
      asked.push(entitlement);
      scopes.push(scope);
      return fake.grant(entitlement, scope);
    },
  });
  return { source, asked, scopes };
}

describe("PlanEntitlementCheckDriver", () => {
  let usage: RowsUsageDriver;

  beforeEach(() => {
    ENTITLEMENT_REGISTRY.clear();
    registerEntitlements([
      {
        type: ProductLimitEntitlement,
        key: "catalogue.product_limit",
        gates: [CreateProductAction],
      },
      { type: ReportsEntitlement, key: "reports.reports", gates: [ListReportsQuery] },
    ]);
    usage = new RowsUsageDriver();
  });

  it("passes a call no entitlement gates without asking the source", async () => {
    const { source, asked } = countingSource([]);
    const check = new PlanEntitlementCheckDriver(source, usage);
    await expect(check.check(callOf(ListProductsQuery))).resolves.toBeUndefined();
    expect(asked).toEqual([]);
  });

  it("is the driver of the pipeline's entitlement step", () => {
    const check = new PlanEntitlementCheckDriver(fakeEntitlements(), usage);
    expect(check).toBeInstanceOf(EntitlementCheck);
  });

  it("passes a granted feature and refuses one outside the plan", async () => {
    const granted = new PlanEntitlementCheckDriver(
      fakeEntitlements([[ReportsEntitlement, true]]),
      usage,
    );
    await expect(granted.check(callOf(ListReportsQuery))).resolves.toBeUndefined();
    for (const plan of [fakeEntitlements(), fakeEntitlements([[ReportsEntitlement, false]])])
      await expect(
        new PlanEntitlementCheckDriver(plan, usage).check(callOf(ListReportsQuery)),
      ).rejects.toBeInstanceOf(EntitlementRequiredError);
  });

  it("creates below the limit and refuses once the count reaches it", async () => {
    const check = new PlanEntitlementCheckDriver(
      fakeEntitlements([[ProductLimitEntitlement, 2]]),
      usage,
    );
    usage.rows = [ACME.id, OTHER, OTHER];
    await expect(check.check(callOf(CreateProductAction))).resolves.toBeUndefined();
    usage.rows = [ACME.id, ACME.id];
    const refused = await check.check(callOf(CreateProductAction)).catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(LimitReachedError);
    expect((refused as LimitReachedError).details).toEqual({
      entitlement: "catalogue.product_limit",
      limit: 2,
    });
  });

  it("counts in the call's scope, and platform-wide for a call without one", async () => {
    const { source, scopes } = countingSource([[ProductLimitEntitlement, 2]]);
    const check = new PlanEntitlementCheckDriver(source, usage);
    usage.rows = [ACME.id, ACME.id];
    await expect(check.check(callOf(CreateProductAction))).rejects.toBeInstanceOf(
      LimitReachedError,
    );
    await expect(check.check(callOf(CreateProductAction, null))).resolves.toBeUndefined();
    expect(scopes).toEqual([ACME.id, undefined]);
  });

  it("refuses a limit outside the plan and never counts an unlimited one", async () => {
    await expect(
      new PlanEntitlementCheckDriver(fakeEntitlements(), usage).check(callOf(CreateProductAction)),
    ).rejects.toBeInstanceOf(EntitlementRequiredError);
    usage.rows = [ACME.id, ACME.id, ACME.id];
    const unlimited = new PlanEntitlementCheckDriver(
      fakeEntitlements([[ProductLimitEntitlement, Number.POSITIVE_INFINITY]]),
      usage,
    );
    await expect(unlimited.check(callOf(CreateProductAction))).resolves.toBeUndefined();
    expect(usage.counted).toBe(0);
  });

  it("treats a grant of the wrong shape as a bug", async () => {
    await expect(
      new PlanEntitlementCheckDriver(fakeEntitlements([[ReportsEntitlement, 3]]), usage).check(
        callOf(ListReportsQuery),
      ),
    ).rejects.toThrow(TypeError);
    await expect(
      new PlanEntitlementCheckDriver(
        fakeEntitlements([[ProductLimitEntitlement, true]]),
        usage,
      ).check(callOf(CreateProductAction)),
    ).rejects.toThrow(/is a limit, so its source answers a count/);
  });

  it("runs as the entitlement step of ActionPipeline", async () => {
    const check = new PlanEntitlementCheckDriver(
      fakeEntitlements([[ProductLimitEntitlement, 1]]),
      usage,
    );
    const bindings = new Map<AnyClass, object>([
      [AccessControl, new AllowAllDriver()],
      [EntitlementCheck, check],
      [CreateProductAction, new CreateProductAction()],
    ]);
    const resolver: Resolver = {
      has: (token) => bindings.has(token),
      get: <T extends object>(token: AnyClass<T>) => bindings.get(token) as T,
    };
    const pipeline = new ActionPipeline(resolver);
    await expect(
      pipeline.execute(CreateProductAction, {} as never, { actor: customer, scope: ACME }),
    ).resolves.toBe("created");
    usage.rows = [ACME.id];
    await expect(
      pipeline.execute(CreateProductAction, {} as never, { actor: customer, scope: ACME }),
    ).rejects.toBeInstanceOf(LimitReachedError);
  });
});
