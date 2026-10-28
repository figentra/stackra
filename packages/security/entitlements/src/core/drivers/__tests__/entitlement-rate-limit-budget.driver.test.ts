/**
 * Stackra file contract:
 * Purpose: unit tests of `EntitlementRateLimitBudgetDriver`: the area bucket comes from the scope's
 *          `rate_limit.<area>_per_minute` and `rate_limit.<area>_burst` values (burst defaults to the per-minute
 *          value), asked in the call's scope; a plan without the per-minute value answers `undefined`; a grant that
 *          is not a number is a bug.
 * Boundary: test only; the source is a map keyed by entitlement key and scope.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0217 (decision 2);
 *                     ADR 0408; STA-1477.
 */
import type { CallDescriptor } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  ApiArea,
  type PublicId,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { EntitlementSource } from "#contracts/ports/entitlement-source.port";
import type { EntitlementKey } from "#contracts/types/entitlement-key.type";
import { EntitlementRateLimitBudgetDriver } from "#core/drivers/entitlement-rate-limit-budget.driver";

/** Answers `<key>@<scope>` from its rows and records what was asked. */
class PlanSource extends Driver(EntitlementSource) {
  readonly asked: string[] = [];

  private readonly rows: ReadonlyMap<string, boolean | number>;

  constructor(rows: Readonly<Record<string, boolean | number>>) {
    super();
    this.rows = new Map(Object.entries(rows));
  }

  async grant(
    key: EntitlementKey,
    scope: PublicId | undefined,
  ): Promise<boolean | number | undefined> {
    const asked = `${key}@${scope ?? "platform"}`;
    this.asked.push(asked);
    return this.rows.get(asked);
  }
}

const customer: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };

/** The scope the calls act in. */
const ACME: ScopeRef = { id: "scp_1", path: "platform.acme" };

/** A call on `area`, in Acme unless `scoped` is false. */
function callOn(area: ApiArea, scoped = true): CallDescriptor {
  return {
    callId: "call_1",
    type: class {},
    kind: "query",
    key: "order.get",
    actor: customer,
    ...(scoped ? { scope: ACME } : {}),
    area,
  };
}

describe(EntitlementRateLimitBudgetDriver, () => {
  it("sizes the bucket from the scope's per-minute and burst values", async () => {
    const source = new PlanSource({
      "rate_limit.app_per_minute@scp_1": 120,
      "rate_limit.app_burst@scp_1": 40,
    });
    expect(
      await new EntitlementRateLimitBudgetDriver(source).areaBucket(callOn(ApiArea.App)),
    ).toEqual({
      capacity: 40,
      tokensPerSecond: 2,
    });
    expect(source.asked).toEqual(["rate_limit.app_per_minute@scp_1", "rate_limit.app_burst@scp_1"]);
  });

  it("uses the per-minute value as the burst when the plan sets none, and the platform plan without a scope", async () => {
    const source = new PlanSource({ "rate_limit.public_per_minute@platform": 60 });
    expect(
      await new EntitlementRateLimitBudgetDriver(source).areaBucket(callOn(ApiArea.Public, false)),
    ).toEqual({ capacity: 60, tokensPerSecond: 1 });
  });

  it("answers undefined when the plan sets no per-minute value", async () => {
    const source = new PlanSource({ "rate_limit.admin_burst@scp_1": 10 });
    expect(
      await new EntitlementRateLimitBudgetDriver(source).areaBucket(callOn(ApiArea.Admin)),
    ).toBeUndefined();
    expect(source.asked).toEqual(["rate_limit.admin_per_minute@scp_1"]);
  });

  it("throws on a grant that is not a number", async () => {
    const source = new PlanSource({ "rate_limit.app_per_minute@scp_1": true });
    await expect(
      new EntitlementRateLimitBudgetDriver(source).areaBucket(callOn(ApiArea.App)),
    ).rejects.toThrow(TypeError);
  });
});
