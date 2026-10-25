/**
 * Stackra file contract:
 * Purpose: unit tests of `RuleSetService`: `open` stores a rule set of the consumer in the scope; `draft` checks the
 *          condition against the consumer's `Rules`, numbers the revision after the stored ones and copies the scope,
 *          refuses another consumer's rule set and an invalid condition, and turns a unique violation into
 *          `rule_set_changed`; `publish` stamps the revision and records `RuleSetPublished`; `revision` reads the one
 *          published last or a stated one; `evaluate` runs that revision and names it.
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

import { FieldType, Operator } from "#contracts/index";
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
