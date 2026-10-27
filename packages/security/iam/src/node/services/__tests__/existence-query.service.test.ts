/**
 * Stackra file contract:
 * Purpose: unit tests of `ExistenceQueryService`: the query selects the primary key only, ANDs the caller's match with
 *          the `see`-or-`exists` conditions, caps at the limit and answers existence-only hits under the model key; a
 *          principal an `exists` rule opens reads the match alone; an unregistered model, a `$raw` match and a bad
 *          limit are refused before any read.
 * Boundary: test only; the source is `MemoryPolicySourceDriver`, the clock fixed, the call context a settable stand-in,
 *           and the database a stand-in whose query builder records its calls (`Database.current` spied).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0333 (decision 2, the existence capability); STA-933.
 */
import { ContextStorage } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock, type PublicId, Realm } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { Model, Visibility } from "@stackra/model";
import { Rules } from "@stackra/rules";
import { type FactField, FieldType, Operator } from "@stackra/rules/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Capability } from "#contracts/index";
import { Decision, MemoryPolicySourceDriver, PolicyDecisionPointService } from "#core/index";
import type { MemoryPolicyState } from "#core/index";
import { VISIBILITY_REGISTRY } from "#node/constants/visibility-registry.constant";
import { IamVisibilityFilterDriver } from "#node/drivers/iam-visibility-filter.driver";
import { registerVisibility } from "#node/functions/register-visibility.function";
import { ExistenceQueryService } from "#node/services/existence-query.service";

const NOW = new Date("2026-10-25T09:00:00Z");
const VIP: PublicId<"seg"> = "seg_01j9z3k4m5n6p7q8r9s0t1v2v1";
const MATTER_ID = "mat_01j9z3k4m5n6p7q8r9s0t1v2m1";
const OPEN = { field: "record.status", operator: Operator.Equals, value: "open" } as const;
const OPEN_FILTER = { $and: [{ $not: { status: null } }, { status: { $eq: "open" } }] };

const customer: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2c1",
  realm: Realm.Customer,
};

/** Always `NOW`. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date(NOW);
  }
}

/** The running call, set by each test. */
class FixedContextStorageDriver extends Driver(ContextStorage) {
  value: object | undefined = undefined;

  run<T>(value: object, work: () => T): T {
    this.value = value;
    return work();
  }

  current(): object | undefined {
    return this.value;
  }
}

const MATTER_RULES = Rules.create({
  key: "legal.matter",
  sources: [
    {
      key: "record",
      fields: {
        status: { type: FieldType.String, label: "legal::fields.status" as FactField["label"] },
      },
    },
  ],
});

@Visibility({ attributes: ["status"] })
class Matter extends Model.with() {
  status!: string;
}

class Invoice extends Model.with() {}

/** The VIP segment sees open matters. */
const SEE_OPEN: MemoryPolicyState = {
  segments: [{ principal: customer.id, segment: VIP }],
  visibility: [
    {
      model: "legal.matter",
      audience: { kind: "segment", id: VIP },
      capability: Capability.See,
      condition: OPEN,
    },
  ],
};

/** A service over `state` with `customer` calling, and the query builder it reaches. */
function serviceOver(state: MemoryPolicyState) {
  const source = new MemoryPolicySourceDriver();
  source.load(state);
  const clock = new FixedClockDriver();
  const context = new FixedContextStorageDriver();
  context.value = { actor: customer, now: () => NOW };
  const filter = new IamVisibilityFilterDriver(
    new PolicyDecisionPointService(source, clock),
    context,
    clock,
  );
  const builder = {
    select: vi.fn(() => builder),
    where: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    execute: vi.fn(async () => [{ id: MATTER_ID }]),
  };
  const em = {
    getMetadata: () => ({ primaryKeys: ["id"] }),
    createQueryBuilder: vi.fn(() => builder),
  };
  vi.spyOn(Database, "current").mockReturnValue({ em: () => em } as unknown as Database);
  return { service: new ExistenceQueryService(filter, context), builder, em };
}

describe(ExistenceQueryService, () => {
  beforeEach(() => {
    VISIBILITY_REGISTRY.clear();
    registerVisibility([
      { model: Matter, key: "legal.matter", rules: MATTER_RULES, unmatched: Decision.Deny },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the key only, under the see-or-exists conditions, capped at the limit", async () => {
    const { service, builder } = serviceOver(SEE_OPEN);
    const hits = await service.matching(Matter, { status: "closed" }, { limit: 5 });
    expect(hits).toEqual([{ kind: "exists", id: MATTER_ID, model: "legal.matter" }]);
    expect(builder.select).toHaveBeenCalledWith("id");
    expect(builder.limit).toHaveBeenCalledWith(5);
    expect(builder.where).toHaveBeenCalledWith({
      $and: [{ status: "closed" }, { $or: [{ $or: [OPEN_FILTER] }, { $or: [] }] }],
    });
  });

  it("reads the match alone for a principal an exists rule opens", async () => {
    const { service, builder } = serviceOver({
      ...SEE_OPEN,
      visibility: [
        ...(SEE_OPEN.visibility ?? []),
        {
          model: "legal.matter",
          audience: { kind: "segment", id: VIP },
          capability: Capability.Exists,
        },
      ],
    });
    await service.matching(Matter, { status: "closed" }, { limit: 1 });
    expect(builder.where).toHaveBeenCalledWith({ status: "closed" });
  });

  it("refuses an unregistered model, a $raw match and a bad limit before any read", async () => {
    const { service, em } = serviceOver(SEE_OPEN);
    await expect(service.matching(Invoice, {}, { limit: 1 })).rejects.toThrow(TypeError);
    await expect(service.matching(Matter, { $raw: [] } as never, { limit: 1 })).rejects.toThrow(
      TypeError,
    );
    await expect(service.matching(Matter, {}, { limit: 0 })).rejects.toThrow(TypeError);
    await expect(service.matching(Matter, {}, { limit: 1.5 })).rejects.toThrow(TypeError);
    expect(em.createQueryBuilder).not.toHaveBeenCalled();
  });
});
