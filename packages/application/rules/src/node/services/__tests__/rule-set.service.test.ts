/**
 * Stackra file contract:
 * Purpose: unit tests of `RuleSetService`: `open` stores a rule set of the consumer in the scope; `draft` checks the
 *          condition against the consumer's `Rules`, numbers the revision after the stored ones and copies the scope,
 *          refuses another consumer's rule set and an invalid condition, and turns a unique violation into
 *          `rule_set_changed`; `publish` stamps the revision and records `RuleSetPublished`; `revision` reads the one
 *          published last or a stated one; `evaluate` runs that revision and names it; a draft stores checked outcomes;
 *          `decide` guards the published revision's outcomes against the floors; `seed` creates and publishes a
 *          template, skips the version it already holds, keeps a tenant's edit and updates a seeded copy; `seedPack`
 *          seeds each template against its consumer's `Rules`.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decisions 5, 6 and 10); ADR 0327 (decisions 3 and 9).
 */
import { Revision } from "@stackra/content/node";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService, Database, registerModelPartners, UniqueViolation } from "@stackra/database";
import { isRefusal, NotFoundError } from "@stackra/errors";
import { takeRecordedEvents } from "@stackra/events";
import type { I18nKey } from "@stackra/i18n";
import { afterEach, describe, expect, freezeClock, it } from "@stackra/testing";
import { vi } from "vitest";

import { FloorBound } from "@stackra/market-packs";
import type { ResolvedValue } from "@stackra/market-packs";

import { FieldType, Operator, SeedResult } from "#contracts/index";
import {
  type Condition,
  ConditionInvalidError,
  RuleSetChangedError,
  RuleSetPublished,
  Rules,
} from "#core/index";
import { RuleSet } from "#node/models/rule-set.model";
import { RuleSetService } from "#node/services/rule-set.service";

/** The revisions repository, as `repositoryOf(Revision)` makes it, without its abstract type. */
class RevisionRepository extends CrudService<Revision> {}

registerModelPartners([
  [RuleSetService, RuleSet],
  [RevisionRepository, Revision],
]);

/** The scope every call runs in. */
const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

/** The consumer's registry. */
const RULES = Rules.create({
  key: "shop.discount",
  sources: [
    { key: "cart", fields: { items: { type: FieldType.Number, label: "shop::items" as I18nKey } } },
  ],
  outcomes: [
    {
      key: "refundWindow",
      label: "shop::refund" as I18nKey,
      params: {
        days: {
          type: FieldType.Number,
          label: "shop::days" as I18nKey,
          floor: "consumer.withdrawal_days",
        },
      },
    },
  ],
});

/** A valid condition. */
const BIG_CART: Condition = { field: "cart.items", operator: Operator.AtLeast, value: 10 };

/** A stored rule set of `consumer`. */
function storedRuleSet(consumer = RULES.key): RuleSet {
  return Object.assign(new RuleSet(), { scopeId: SCOPE.id, scopePath: SCOPE.path, consumer });
}

/** A stored revision of `ruleSet`. */
function storedRevision(ruleSet: RuleSet, number: number, publishedAt: Date | null): Revision {
  return Object.assign(new Revision(), {
    scopeId: SCOPE.id,
    scopePath: SCOPE.path,
    model: "rules.rule_set",
    recordId: ruleSet.id,
    number,
    data: { condition: BIG_CART },
    publishedAt,
  });
}

/** Connects a recording entity manager that holds `ruleSet`, `revisions` and `count` stored revisions. */
function connect(ruleSet: RuleSet | null, revisions: Revision[] = [], count = 0) {
  const em = {
    findOneOrFail: vi.fn(
      async (model: unknown, _where: unknown, options: { failHandler: () => Error }) => {
        const row = model === RuleSet ? ruleSet : (revisions[0] ?? null);
        if (row === null) throw options.failHandler();
        return row;
      },
    ),
    find: vi.fn(async (_model: unknown, _where: unknown, _options?: unknown) => revisions),
    count: vi.fn(async (_model: unknown, _where: unknown) => count),
    create: vi.fn((Row: new () => object, data: object) => Object.assign(new Row(), data)),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return em;
}

/** The service with the revisions repository. */
const serviceOf = () => new RuleSetService(new RevisionRepository());

afterEach(() => {
  vi.restoreAllMocks();
});

describe(RuleSetService, () => {
  it("opens a rule set of the consumer in the scope", async () => {
    const em = connect(null);
    const ruleSet = await serviceOf().open(SCOPE, RULES);
    expect(ruleSet).toMatchObject({
      scopeId: SCOPE.id,
      scopePath: SCOPE.path,
      consumer: "shop.discount",
    });
    expect(ruleSet.id).toMatch(/^rset_/);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it("drafts a checked condition as the next revision in the rule set's scope", async () => {
    const ruleSet = storedRuleSet();
    const em = connect(ruleSet, [], 2);
    expect(await serviceOf().draft(ruleSet.id, RULES, BIG_CART)).toBe(3);
    expect(em.count).toHaveBeenCalledWith(Revision, {
      model: "rules.rule_set",
      recordId: ruleSet.id,
    });
    expect(em.create).toHaveBeenCalledWith(Revision, {
      scopeId: SCOPE.id,
      scopePath: SCOPE.path,
      model: "rules.rule_set",
      recordId: ruleSet.id,
      number: 3,
      data: { condition: BIG_CART },
    });
  });

  it("refuses another consumer's rule set and an invalid condition, writing nothing", async () => {
    const ruleSet = storedRuleSet();
    const shipping = connect(storedRuleSet("shop.shipping"));
    const otherConsumer = await serviceOf()
      .draft(ruleSet.id, RULES, BIG_CART)
      .catch((error: unknown) => error);
    expect(isRefusal(otherConsumer, NotFoundError)).toBe(true);
    const discount = connect(ruleSet);
    const invalid = await serviceOf()
      .draft(ruleSet.id, RULES, { field: "cart.items", operator: Operator.Contains, value: "1" })
      .catch((error: unknown) => error);
    expect(isRefusal(invalid, ConditionInvalidError)).toBe(true);
    expect(shipping.create).not.toHaveBeenCalled();
    expect(discount.create).not.toHaveBeenCalled();
  });

  it("turns a taken revision number into rule_set_changed", async () => {
    const ruleSet = storedRuleSet();
    const em = connect(ruleSet);
    em.flush.mockRejectedValueOnce(new UniqueViolation(new Error("duplicate key")));
    const refused = await serviceOf()
      .draft(ruleSet.id, RULES, BIG_CART)
      .catch((error: unknown) => error);
    expect(isRefusal(refused, RuleSetChangedError)).toBe(true);
    expect((refused as RuleSetChangedError).ruleSetId).toBe(ruleSet.id);
  });

  it("publishes a revision and records RuleSetPublished", async () => {
    const restore = freezeClock("2026-10-25T09:00:00Z");
    try {
      const ruleSet = storedRuleSet();
      const draft = storedRevision(ruleSet, 2, null);
      connect(ruleSet, [draft]);
      await serviceOf().publish(ruleSet.id, 2);
      expect(draft.publishedAt).toEqual(new Date("2026-10-25T09:00:00Z"));
      const [event] = takeRecordedEvents(ruleSet);
      expect(event).toBeInstanceOf(RuleSetPublished);
      expect(event).toEqual({ ruleSetId: ruleSet.id, consumer: "shop.discount", revision: 2 });
    } finally {
      restore();
    }
  });

  it("reads the revision published last, or a stated one", async () => {
    const ruleSet = storedRuleSet();
    const published = storedRevision(ruleSet, 2, new Date("2026-10-20T00:00:00Z"));
    const em = connect(ruleSet, [published]);
    expect(await serviceOf().revision(ruleSet.id)).toEqual({
      number: 2,
      condition: BIG_CART,
      outcomes: [],
      publishedAt: published.publishedAt,
    });
    expect(em.find).toHaveBeenLastCalledWith(
      Revision,
      { model: "rules.rule_set", recordId: ruleSet.id, publishedAt: { $ne: null } },
      { orderBy: { publishedAt: "desc" }, limit: 1 },
    );
    await serviceOf().revision(ruleSet.id, 2);
    expect(em.find).toHaveBeenLastCalledWith(
      Revision,
      { model: "rules.rule_set", recordId: ruleSet.id, number: 2 },
      { orderBy: { publishedAt: "desc" }, limit: 1 },
    );
  });

  it("refuses a revision that is not there", async () => {
    connect(storedRuleSet(), []);
    const missing = await serviceOf()
      .revision("rset_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"rset">)
      .catch((error: unknown) => error);
    expect(isRefusal(missing, NotFoundError)).toBe(true);
  });

  it("evaluates the published revision and names it", async () => {
    const ruleSet = storedRuleSet();
    connect(ruleSet, [storedRevision(ruleSet, 5, new Date("2026-10-20T00:00:00Z"))]);
    const now = new Date("2026-10-25T09:00:00Z");
    const result = await serviceOf().evaluate(ruleSet.id, RULES, { cart: { items: 12 } }, { now });
    expect(result.matched).toBe(true);
    expect(result.revision).toBe(5);
  });
});

/** A refund window outcome of `days`. */
const refund = (days: number) => ({ kind: "refundWindow", params: { days } });

/** A template of the seeded consumer. */
const TEMPLATE = {
  key: "shop.returns",
  consumer: "shop.discount",
  condition: BIG_CART,
  outcomes: [refund(30)],
};

/**
 * Connects an entity manager for a seed: `known` is the seeded rule set already there (or none), `latest` its latest
 * revision; every row the seed creates is kept and found again.
 */
function connectSeed(known: RuleSet | null, latest: Revision[] = []) {
  const created: object[] = [];
  const em = {
    findOne: vi.fn(async () => known),
    findOneOrFail: vi.fn(async (model: unknown) =>
      model === RuleSet
        ? (known ?? created.find((row) => row instanceof RuleSet))
        : created.findLast((row) => row instanceof Revision),
    ),
    find: vi.fn(async () => latest),
    count: vi.fn(async () => latest.length),
    create: vi.fn((Row: new () => object, data: object) => {
      const row = Object.assign(new Row(), data);
      created.push(row);
      return row;
    }),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return { em, created };
}

describe("RuleSetService outcomes and seeds", () => {
  it("drafts checked outcomes beside the condition", async () => {
    const ruleSet = storedRuleSet();
    const em = connect(ruleSet);
    await serviceOf().draft(ruleSet.id, RULES, BIG_CART, [refund(30)]);
    expect(em.create).toHaveBeenCalledWith(
      Revision,
      expect.objectContaining({
        data: { condition: BIG_CART, outcomes: [refund(30)] },
      }),
    );
  });

  it("decides the published revision with its outcomes guarded against the floors", async () => {
    const ruleSet = storedRuleSet();
    const published = Object.assign(storedRevision(ruleSet, 4, new Date("2026-10-20T00:00:00Z")), {
      data: { condition: BIG_CART, outcomes: [refund(7)] },
    });
    connect(ruleSet, [published]);
    const floors = [
      {
        key: "consumer.withdrawal_days",
        value: 14,
        market: "eu",
        version: "1.0.0",
        floor: { bound: FloorBound.Min, law: "Directive 2011/83/EU" },
      },
    ] as ResolvedValue[];
    const decision = await serviceOf().decide(
      ruleSet.id,
      RULES,
      { cart: { items: 12 } },
      { now: new Date("2026-10-25T09:00:00Z"), floors },
    );
    expect(decision.evaluation.revision).toBe(4);
    expect(decision.outcomes).toEqual([refund(14)]);
  });

  it("creates and publishes a template the scope does not have", async () => {
    const { created } = connectSeed(null);
    expect(await serviceOf().seed(SCOPE, RULES, TEMPLATE, "1.0.0")).toBe(SeedResult.Created);
    const [ruleSet, revision] = created as [RuleSet, Revision];
    expect(ruleSet).toMatchObject({
      seedKey: "shop.returns",
      seedVersion: "1.0.0",
      consumer: "shop.discount",
    });
    expect(revision.data).toEqual({
      condition: BIG_CART,
      outcomes: [refund(30)],
      seed: { key: "shop.returns", version: "1.0.0" },
    });
    expect(revision.publishedAt).not.toBeNull();
  });

  it("leaves a copy already at the version, and keeps a tenant's edit", async () => {
    const seeded = Object.assign(storedRuleSet(), {
      seedKey: "shop.returns",
      seedVersion: "1.0.0",
    });
    connectSeed(seeded);
    expect(await serviceOf().seed(SCOPE, RULES, TEMPLATE, "1.0.0")).toBe(SeedResult.Current);
    const { created } = connectSeed(seeded, [storedRevision(seeded, 2, null)]);
    expect(await serviceOf().seed(SCOPE, RULES, TEMPLATE, "1.1.0")).toBe(SeedResult.Kept);
    expect(created).toEqual([]);
    expect(seeded.seedVersion).toBe("1.0.0");
  });

  it("updates a seeded copy the tenant left alone", async () => {
    const seeded = Object.assign(storedRuleSet(), {
      seedKey: "shop.returns",
      seedVersion: "1.0.0",
    });
    const seedRevision = Object.assign(storedRevision(seeded, 1, new Date()), {
      data: { condition: BIG_CART, seed: { key: "shop.returns", version: "1.0.0" } },
    });
    const { created } = connectSeed(seeded, [seedRevision]);
    expect(await serviceOf().seed(SCOPE, RULES, TEMPLATE, "1.1.0")).toBe(SeedResult.Updated);
    expect((created[0] as Revision).number).toBe(2);
    expect(seeded.seedVersion).toBe("1.1.0");
  });

  it("refuses a template of another consumer, and seeds a pack per consumer", async () => {
    connectSeed(null);
    await expect(
      serviceOf().seed(SCOPE, RULES, { ...TEMPLATE, consumer: "shop.shipping" }, "1.0.0"),
    ).rejects.toThrow(TypeError);
    const pack = { key: "shop", version: "1.0.0", ruleSets: [TEMPLATE] };
    expect(await serviceOf().seedPack(SCOPE, pack, [RULES])).toEqual({
      "shop.returns": SeedResult.Created,
    });
    await expect(serviceOf().seedPack(SCOPE, pack, [])).rejects.toThrow(/needs the Rules/);
  });
});
