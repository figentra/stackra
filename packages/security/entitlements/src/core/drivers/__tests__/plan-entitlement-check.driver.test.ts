/**
 * Stackra file contract:
 * Purpose: unit tests of `PlanEntitlementCheckDriver`: an ungated call passes without asking the source, a feature or
 *          module outside the plan refuses `entitlement_required`, a limit refuses `limit_reached` once the count
 *          reaches the grant (the template's two-product plan), the grant and the count are asked in the call's
 *          `scope` (platform-wide without one), no limit never counts, a grant of the wrong shape is a bug, a soft
 *          limit passes past its allowance while its grace period runs and up to its ceiling, a filtered limit hands
 *          its `where` to the usage so a retired till stops counting (STA-913), a quota refuses `quota_exceeded` once
 *          its meter's period total reaches the grant, warns while a soft quota's grace runs and throws with no
 *          meter totals bound (stackra-309), and the driver runs as the entitlement step of the real `ActionPipeline`.
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
  Clock,
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
import { QuotaExceededError } from "#core/errors/quota-exceeded.error";
import { QuotaPeriod } from "#core/enums/quota-period.enum";
import { MeterTotals } from "#contracts/ports/meter-totals.port";
import { QuotaWarnings } from "#contracts/ports/quota-warnings.port";
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

class CreateProductAction extends Action({
  key: "product.create",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<string> {
    return "created";
  }
}

class ListReportsQuery extends Query({
  key: "report.list",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<readonly string[]> {
    return [];
  }
}

class ListProductsQuery extends Query({
  key: "product.list",
  actors: [ActorKind.User],
}) {
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

/** Always 2026-10-25 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-25T09:00:00Z");
  }
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

  it("lets a soft limit pass during its grace period, up to the ceiling", async () => {
    const graceEndsAt = new Date("2026-11-01T00:00:00Z");
    const soft = new PlanEntitlementCheckDriver(
      fakeEntitlements([[ProductLimitEntitlement, { limit: 2, graceEndsAt, ceiling: 3 }]]),
      usage,
      new FixedClockDriver(),
    );
    usage.rows = [ACME.id, ACME.id];
    await expect(soft.check(callOf(CreateProductAction))).resolves.toBeUndefined();
    usage.rows = [ACME.id, ACME.id, ACME.id];
    await expect(soft.check(callOf(CreateProductAction))).rejects.toBeInstanceOf(LimitReachedError);
    const ended = new PlanEntitlementCheckDriver(
      fakeEntitlements([
        [ProductLimitEntitlement, { limit: 2, graceEndsAt: new Date("2026-10-01T00:00:00Z") }],
      ]),
      usage,
      new FixedClockDriver(),
    );
    usage.rows = [ACME.id, ACME.id];
    await expect(ended.check(callOf(CreateProductAction))).rejects.toBeInstanceOf(
      LimitReachedError,
    );
  });
});

/** A value entitlement that gates a call (ADR 0408). */
class ExportWindowDaysEntitlement extends Entitlement({ kind: EntitlementKind.Value }) {}

describe("PlanEntitlementCheckDriver with a value entitlement (STA-824)", () => {
  beforeEach(() => {
    ENTITLEMENT_REGISTRY.clear();
    registerEntitlements([
      {
        type: ExportWindowDaysEntitlement,
        key: "reports.export_window_days",
        gates: [ListReportsQuery],
      },
    ]);
  });

  it("passes when the plan sets the number, refuses when not, and throws on a boolean", async () => {
    const usage = new RowsUsageDriver();
    const set = new PlanEntitlementCheckDriver(
      fakeEntitlements([[ExportWindowDaysEntitlement, 30]]),
      usage,
    );
    await expect(set.check(callOf(ListReportsQuery))).resolves.toBeUndefined();
    expect(usage.counted).toBe(0);
    const unset = new PlanEntitlementCheckDriver(fakeEntitlements(), usage);
    await expect(unset.check(callOf(ListReportsQuery))).rejects.toBeInstanceOf(
      EntitlementRequiredError,
    );
    const wrong = new PlanEntitlementCheckDriver(
      fakeEntitlements([[ExportWindowDaysEntitlement, true]]),
      usage,
    );
    await expect(wrong.check(callOf(ListReportsQuery))).rejects.toThrow(TypeError);
  });
});

class Till {}

/** A till limit that stops counting a retired till (STA-913). */
class TillLimitEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => Till,
  where: { retiredAt: null },
}) {}

class RegisterTillAction extends Action({
  key: "till.register",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<string> {
    return "registered";
  }
}

/** Tills of one scope, each live or retired; counts only those matching `where`. */
class TillsUsageDriver extends Driver(EntitlementUsage) {
  tills: { retiredAt: string | null }[] = [];

  filters: unknown[] = [];

  async count(
    _model: AnyClass,
    _scope: PublicId | undefined,
    where?: Readonly<Record<string, unknown>>,
  ): Promise<number> {
    this.filters.push(where);
    return this.tills.filter((till) =>
      Object.entries(where ?? {}).every(
        ([field, value]) => till[field as keyof typeof till] === value,
      ),
    ).length;
  }
}

describe("PlanEntitlementCheckDriver with a filtered limit", () => {
  beforeEach(() => {
    ENTITLEMENT_REGISTRY.clear();
    registerEntitlements([
      { type: TillLimitEntitlement, key: "pos.till_limit", gates: [RegisterTillAction] },
    ]);
  });

  it("hands the limit's where to the usage, so a retired till frees its place", async () => {
    const usage = new TillsUsageDriver();
    const check = new PlanEntitlementCheckDriver(
      fakeEntitlements([[TillLimitEntitlement, 2]]),
      usage,
    );
    usage.tills = [{ retiredAt: null }, { retiredAt: null }];
    await expect(check.check(callOf(RegisterTillAction))).rejects.toBeInstanceOf(LimitReachedError);
    usage.tills = [{ retiredAt: null }, { retiredAt: "2026-10-01T00:00:00Z" }];
    await expect(check.check(callOf(RegisterTillAction))).resolves.toBeUndefined();
    expect(usage.filters).toEqual([{ retiredAt: null }, { retiredAt: null }]);
  });
});

/** A monthly AI token quota (stackra-309). */
class TokenQuotaEntitlement extends Entitlement({
  kind: EntitlementKind.Quota,
  meter: "ai.tokens",
  per: QuotaPeriod.Month,
}) {}

class AskAssistantAction extends Action({
  key: "assistant.ask",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<string> {
    return "answered";
  }
}

/** Answers `used` for every question and records each one in full. */
class FixedMeterTotalsDriver extends Driver(MeterTotals) {
  used = 0;

  asked: unknown[][] = [];

  async total(meter: string, scope: PublicId | undefined, from: Date, to: Date): Promise<number> {
    this.asked.push([meter, scope, from.toISOString(), to.toISOString()]);
    return this.used;
  }
}

class ListQuotaWarningsDriver extends Driver(QuotaWarnings) {
  heard: unknown[][] = [];

  async warn(
    entitlement: string,
    scope: PublicId | undefined,
    used: number,
    limit: number,
  ): Promise<void> {
    this.heard.push([entitlement, scope, used, limit]);
  }
}

describe("PlanEntitlementCheckDriver with a quota (stackra-309)", () => {
  beforeEach(() => {
    ENTITLEMENT_REGISTRY.clear();
    registerEntitlements([
      { type: TokenQuotaEntitlement, key: "ai.token_quota", gates: [AskAssistantAction] },
    ]);
  });

  it("reads the meter's total for the month in the call's scope and refuses once it reaches the grant", async () => {
    const totals = new FixedMeterTotalsDriver();
    const check = new PlanEntitlementCheckDriver(
      fakeEntitlements([[TokenQuotaEntitlement, 1000]]),
      new RowsUsageDriver(),
      new FixedClockDriver(),
      totals,
    );
    totals.used = 999;
    await expect(check.check(callOf(AskAssistantAction))).resolves.toBeUndefined();
    expect(totals.asked).toEqual([
      ["ai.tokens", ACME.id, "2026-10-01T00:00:00.000Z", "2026-11-01T00:00:00.000Z"],
    ]);
    totals.used = 1000;
    const refused = await check.check(callOf(AskAssistantAction)).catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(QuotaExceededError);
    expect((refused as QuotaExceededError).details).toEqual({
      entitlement: "ai.token_quota",
      meter: "ai.tokens",
      limit: 1000,
      resetsAt: "2026-11-01T00:00:00.000Z",
    });
  });

  it("passes a soft quota in its grace period with a warning, up to the ceiling", async () => {
    const totals = new FixedMeterTotalsDriver();
    const warnings = new ListQuotaWarningsDriver();
    const check = new PlanEntitlementCheckDriver(
      fakeEntitlements([
        [
          TokenQuotaEntitlement,
          { limit: 1000, graceEndsAt: new Date("2026-11-01T00:00:00Z"), ceiling: 1200 },
        ],
      ]),
      new RowsUsageDriver(),
      new FixedClockDriver(),
      totals,
      warnings,
    );
    totals.used = 900;
    await expect(check.check(callOf(AskAssistantAction))).resolves.toBeUndefined();
    totals.used = 1100;
    await expect(check.check(callOf(AskAssistantAction))).resolves.toBeUndefined();
    expect(warnings.heard).toEqual([["ai.token_quota", ACME.id, 1100, 1000]]);
    totals.used = 1200;
    await expect(check.check(callOf(AskAssistantAction))).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
  });

  it("never reads an unlimited quota, refuses one outside the plan and throws without meter totals", async () => {
    const totals = new FixedMeterTotalsDriver();
    const unlimited = new PlanEntitlementCheckDriver(
      fakeEntitlements([[TokenQuotaEntitlement, Number.POSITIVE_INFINITY]]),
      new RowsUsageDriver(),
      undefined,
      totals,
    );
    await expect(unlimited.check(callOf(AskAssistantAction))).resolves.toBeUndefined();
    expect(totals.asked).toEqual([]);
    await expect(
      new PlanEntitlementCheckDriver(fakeEntitlements(), new RowsUsageDriver()).check(
        callOf(AskAssistantAction),
      ),
    ).rejects.toBeInstanceOf(EntitlementRequiredError);
    await expect(
      new PlanEntitlementCheckDriver(
        fakeEntitlements([[TokenQuotaEntitlement, 1000]]),
        new RowsUsageDriver(),
      ).check(callOf(AskAssistantAction)),
    ).rejects.toThrow(/MeterTotals must be bound/);
    await expect(
      new PlanEntitlementCheckDriver(
        fakeEntitlements([[TokenQuotaEntitlement, true]]),
        new RowsUsageDriver(),
        undefined,
        totals,
      ).check(callOf(AskAssistantAction)),
    ).rejects.toThrow(/is a quota, so its source answers a count/);
  });
});
