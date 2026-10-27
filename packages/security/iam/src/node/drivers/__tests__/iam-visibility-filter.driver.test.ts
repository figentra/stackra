/**
 * Stackra file contract:
 * Purpose: unit tests of `IamVisibilityFilterDriver`: no principal and an undeclared model read unchanged; a declaring
 *          model without a row fails closed; the principal's rules become the read's filter, judged at the running
 *          call's scope node and instant; an unmatched record follows the registered answer (nothing visible on
 *          `Deny` with no rule); a followed relation nests the related model's filter under it and lets a record
 *          without the related record through; a cycle of follows fails; the driver is a `VisibilityFilter`; the
 *          existence conditions take `see` or `exists`, through relations too, while reads keep `see` alone.
 * Boundary: test only; the source is `MemoryPolicySourceDriver`, the clock fixed, the call context a settable stand-in.
 *           The registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0333 (decisions 1 to 5 and 7, and its amendment: relations); ADR 0208 (decision 3); STA-933.
 */
import { ContextStorage } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  Clock,
  type PublicId,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import { VisibilityFilter } from "@stackra/database/contracts";
import { ManyToOne, Model, Visibility } from "@stackra/model";
import type { Ref } from "@stackra/model";
import { Rules } from "@stackra/rules";
import { type FactField, FieldType, Operator } from "@stackra/rules/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Capability } from "#contracts/index";
import {
  Decision,
  MemoryPolicySourceDriver,
  PolicyDecisionPointService,
  SystemRole,
} from "#core/index";
import type { MemoryPolicyState } from "#core/index";
import { VISIBILITY_REGISTRY } from "#node/constants/visibility-registry.constant";
import { IamVisibilityFilterDriver } from "#node/drivers/iam-visibility-filter.driver";
import { registerVisibility } from "#node/functions/register-visibility.function";

const NOW = new Date("2026-10-25T09:00:00Z");
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const VIP: PublicId<"seg"> = "seg_01j9z3k4m5n6p7q8r9s0t1v2v1";

const customer: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2c1",
  realm: Realm.Customer,
};
const staff: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2s1",
  realm: Realm.Staff,
};
const job: Actor = { kind: ActorKind.Job, id: "job_01j9z3k4m5n6p7q8r9s0t1v2j1" };

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

/** A label key, as a fact field takes it. */
const label = (name: string): FactField["label"] => `legal::fields.${name}` as FactField["label"];

const MATTER_RULES = Rules.create({
  key: "legal.matter",
  sources: [
    { key: "record", fields: { status: { type: FieldType.String, label: label("status") } } },
  ],
});

const OPEN = { field: "record.status", operator: Operator.Equals, value: "open" } as const;
const OPEN_FILTER = { $and: [{ $not: { status: null } }, { status: { $eq: "open" } }] };

@Visibility({ attributes: ["status"] })
class Matter extends Model.with() {
  status!: string;
}

@Visibility({ follows: ["matter"] })
class Document extends Model.with() {
  @ManyToOne(() => Matter)
  matter!: Ref<Matter>;
}

class Invoice extends Model.with() {}

@Visibility({ follows: ["b"] })
class LoopA extends Model.with() {
  @ManyToOne(() => LoopB)
  b!: Ref<LoopB>;
}

@Visibility({ follows: ["a"] })
class LoopB extends Model.with() {
  @ManyToOne(() => LoopA)
  a!: Ref<LoopA>;
}

/** The VIP segment may see open matters; managers see every matter at their node. */
const STATE: MemoryPolicyState = {
  segments: [{ principal: customer.id, segment: VIP }],
  grants: [{ principal: staff.id, role: SystemRole.Manager, scope: ACME }],
  visibility: [
    {
      model: "legal.matter",
      audience: { kind: "segment", id: VIP },
      capability: Capability.See,
      condition: OPEN,
    },
    {
      model: "legal.matter",
      audience: { kind: "role", key: SystemRole.Manager },
      capability: Capability.See,
    },
  ],
};

/** A driver over `state`, and the context it reads the call from. */
function driverOver(state: MemoryPolicyState): {
  readonly driver: IamVisibilityFilterDriver;
  readonly context: FixedContextStorageDriver;
} {
  const source = new MemoryPolicySourceDriver();
  source.load(state);
  const clock = new FixedClockDriver();
  const context = new FixedContextStorageDriver();
  const driver = new IamVisibilityFilterDriver(
    new PolicyDecisionPointService(source, clock),
    context,
    clock,
  );
  return { driver, context };
}

describe(IamVisibilityFilterDriver, () => {
  beforeEach(() => {
    VISIBILITY_REGISTRY.clear();
    registerVisibility([
      { model: Matter, key: "legal.matter", rules: MATTER_RULES, unmatched: Decision.Deny },
      { model: Document, key: "legal.document", unmatched: Decision.Allow },
    ]);
  });

  it("is a VisibilityFilter that leaves no principal and an undeclared model unchanged", async () => {
    const { driver } = driverOver(STATE);
    expect(driver).toBeInstanceOf(VisibilityFilter);
    expect(await driver.conditionsFor(Matter, undefined)).toEqual({});
    expect(await driver.conditionsFor(Invoice, customer)).toEqual({});
  });

  it("fails closed for a declaring model without a row, and for a cycle of follows", async () => {
    const { driver } = driverOver(STATE);
    await expect(driver.conditionsFor(LoopA, customer)).rejects.toThrow(Error);
    registerVisibility([
      { model: LoopA, key: "legal.loop_a", unmatched: Decision.Allow },
      { model: LoopB, key: "legal.loop_b", unmatched: Decision.Allow },
    ]);
    await expect(driver.conditionsFor(LoopA, customer)).rejects.toThrow(/lead back/);
  });

  it("filters by the principal's rules, at the running call's scope node", async () => {
    const { driver, context } = driverOver(STATE);
    expect(await driver.conditionsFor(Matter, customer)).toEqual({ $or: [OPEN_FILTER] });
    expect(await driver.conditionsFor(Matter, staff)).toEqual({ $or: [] });
    context.value = { scope: ACME, now: () => NOW };
    expect(await driver.conditionsFor(Matter, staff)).toEqual({});
  });

  it("nests a followed relation's filter, letting a record without one through", async () => {
    const { driver } = driverOver(STATE);
    expect(await driver.conditionsFor(Document, customer)).toEqual({
      $or: [{ matter: null }, { matter: { $or: [OPEN_FILTER] } }],
    });
    expect(await driver.conditionsFor(Document, job)).toEqual({});
  });

  it("opens the existence conditions to `exists` rules without widening reads", async () => {
    const { driver } = driverOver({
      ...STATE,
      visibility: [
        ...(STATE.visibility ?? []),
        {
          model: "legal.matter",
          audience: { kind: "segment", id: VIP },
          capability: Capability.Exists,
        },
      ],
    });
    expect(await driver.conditionsFor(Matter, customer)).toEqual({ $or: [OPEN_FILTER] });
    expect(await driver.existenceConditionsFor(Matter, customer)).toEqual({});
    expect(await driver.existenceConditionsFor(Document, customer)).toEqual({});
    expect(await driver.existenceConditionsFor(Matter, undefined)).toEqual({});
  });

  it("gives the existence conditions of `see` alone when no `exists` rule applies", async () => {
    const { driver } = driverOver(STATE);
    expect(await driver.existenceConditionsFor(Matter, customer)).toEqual({
      $or: [{ $or: [OPEN_FILTER] }, { $or: [] }],
    });
  });
});
