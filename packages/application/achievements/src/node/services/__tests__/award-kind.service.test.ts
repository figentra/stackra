/**
 * Stackra file contract:
 * Purpose: unit tests of `AwardKindService`: create writes an active kind with no criteria and refuses an unknown
 *          recipient, a malformed key, blank or repeated levels and an ascending kind with one level; archive clears
 *          `isActive`; draftCriteria opens the rule set once in the kind's scope and refuses a kind with levels;
 *          publishCriteria publishes through the rule set and refuses a kind with no criteria.
 * Boundary: test only; the rule set service is an in-test fake, a fake `Database.current()` hands out a recording
 *           entity manager, and the recipient registry holds one test model.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decisions 1, 2 and 4).
 */
import { InputInvalidError } from "@stackra/actions";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { Database, registerModelPartners } from "@stackra/database";
import { Rules } from "@stackra/rules";
import { type FactField, type FactSource, FieldType } from "@stackra/rules/contracts";
import type { RuleSetService } from "@stackra/rules/node";
import { afterAll, afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AWARD_RECIPIENTS } from "#node/constants/award-recipients.constant";
import { AwardKind } from "#node/models/award-kind.model";
import { AwardKindService } from "#node/services/award-kind.service";

registerModelPartners([[AwardKindService, AwardKind]]);

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const RULE_SET = "rset_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"rset">;
const MEMBER = "test.member";

/** The one fact source `Rules.create` requires. */
const SOURCES: FactSource[] = [
  {
    key: "member",
    fields: { sales: { type: FieldType.Number, label: "test::facts.sales" as FactField["label"] } },
  },
];
const RULES = Rules.create({ key: "test.member_award", sources: SOURCES });
AWARD_RECIPIENTS.set(MEMBER, RULES);

/** A stored kind with `data`. */
const kindOf = (data: Partial<AwardKind> = {}): AwardKind =>
  Object.assign(new AwardKind(), {
    scopeId: ACME.id,
    scopePath: ACME.path,
    key: "employee_of_month",
    name: "Employee of the month",
    recipientModel: MEMBER,
    levels: [],
    isAscending: false,
    isOncePerPeriod: true,
    ruleSetId: null,
    certificateTemplate: null,
    isActive: true,
    ...data,
  });

/** A service whose entity manager reads `stored`. */
function setup(stored?: AwardKind) {
  const em = {
    findOneOrFail: vi.fn(async () => stored),
    create: vi.fn((_model: unknown, data: object) => Object.assign(new AwardKind(), data)),
    assign: vi.fn((row: object, data: object) => Object.assign(row, data)),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  const ruleSets = {
    open: vi.fn(async (_scope: ScopeRef, _rules: Rules) => ({ id: RULE_SET })),
    draft: vi.fn(async (_id: string, _rules: Rules, _condition: unknown) => 1),
    publish: vi.fn(async (_id: string, _revision: number) => undefined),
  };
  const service = new AwardKindService(ruleSets as unknown as RuleSetService);
  return { service, em, ruleSets };
}

/** The field errors of the refusal `work` throws. */
async function fieldErrorsOf(work: Promise<unknown>): Promise<unknown> {
  const refused = await work.catch((error: unknown) => error);
  expect(refused).toBeInstanceOf(InputInvalidError);
  return (refused as InputInvalidError).fieldErrors;
}

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  AWARD_RECIPIENTS.clear();
});

describe(AwardKindService, () => {
  it("creates an active kind with no criteria", async () => {
    const { service, em } = setup();
    const kind = await service.create(ACME, {
      key: "belt",
      name: "Belt grading",
      recipient: MEMBER,
      levels: ["white", "yellow"],
      isAscending: true,
      certificateTemplate: "test::print/certificate",
    });
    expect(kind).toBeInstanceOf(AwardKind);
    expect(em.create.mock.calls[0]?.[1]).toEqual({
      scopeId: ACME.id,
      scopePath: ACME.path,
      key: "belt",
      name: "Belt grading",
      recipientModel: MEMBER,
      levels: ["white", "yellow"],
      isAscending: true,
      isOncePerPeriod: false,
      ruleSetId: null,
      certificateTemplate: "test::print/certificate",
      isActive: true,
    });
  });

  it("refuses an unknown recipient, a bad key and bad levels", async () => {
    const { service } = setup();
    const draft = { key: "belt", name: "Belt", recipient: MEMBER };
    await expect(
      fieldErrorsOf(service.create(ACME, { ...draft, recipient: "test.x" })),
    ).resolves.toEqual({
      recipient: "recipient_unknown",
    });
    await expect(
      fieldErrorsOf(service.create(ACME, { ...draft, key: "Belt", levels: ["a", "A"] })),
    ).resolves.toEqual({ key: "key_invalid", levels: "levels_invalid" });
    await expect(
      fieldErrorsOf(service.create(ACME, { ...draft, levels: ["white"], isAscending: true })),
    ).resolves.toEqual({ levels: "levels_too_few" });
  });

  it("archives a kind", async () => {
    const kind = kindOf();
    const { service } = setup(kind);
    await service.archive(kind.id);
    expect(kind.isActive).toBe(false);
  });

  it("opens the criteria rule set once, in the kind's scope, and drafts through it", async () => {
    const kind = kindOf();
    const { service, ruleSets } = setup(kind);
    await expect(service.draftCriteria(kind.id, { all: [] })).resolves.toBe(1);
    await service.draftCriteria(kind.id, { all: [] });
    expect(ruleSets.open).toHaveBeenCalledTimes(1);
    expect(ruleSets.open).toHaveBeenCalledWith(ACME, RULES);
    expect(ruleSets.draft).toHaveBeenCalledWith(RULE_SET, RULES, { all: [] });
    expect(kind.ruleSetId).toBe(RULE_SET);
  });

  it("refuses criteria on a kind with levels", async () => {
    const kind = kindOf({ levels: ["white", "yellow"] });
    const { service } = setup(kind);
    await expect(fieldErrorsOf(service.draftCriteria(kind.id, { all: [] }))).resolves.toEqual({
      criteria: "criteria_with_levels",
    });
  });

  it("publishes criteria and refuses a kind with none", async () => {
    const kind = kindOf({ ruleSetId: RULE_SET });
    const { service, ruleSets } = setup(kind);
    await service.publishCriteria(kind.id, 2);
    expect(ruleSets.publish).toHaveBeenCalledWith(RULE_SET, 2);
    const bare = kindOf();
    const other = setup(bare);
    await expect(fieldErrorsOf(other.service.publishCriteria(bare.id, 1))).resolves.toEqual({
      criteria: "criteria_missing",
    });
  });
});
