/**
 * Stackra file contract:
 * Purpose: unit tests of `SegmentService`: create opens a rule set for a dynamic segment and none for a manual one and
 *          refuses an unknown subject; draft and publish go through the rule set (publish queues the recompute in the
 *          segment's scope) and refuse a manual segment; a full recompute enters the matched non-members, removes the
 *          members no longer matched and records the revision and time; a segment with no published revision keeps
 *          its members; a subject recompute runs in each segment's scope and removes a deleted subject; add refuses an
 *          unknown subject and enters only non-members; remove leaves members; the hourly run queues every dynamic
 *          segment in its scope; nothing is computed before `connect`.
 * Boundary: test only; the rule set, membership and queue services, the database's scope session and the clock are
 *           in-test fakes, a fake `Database.current()` hands out a recording entity manager, and @stackra/rules
 *           evaluates for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decisions 1 to 5); ADR 0331 (decisions 6 and 9).
 */
import { InputInvalidError, type Resolver } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";
import type { Clock, PublicId, ScopeRef } from "@stackra/contracts";
import { Database, registerModelPartners } from "@stackra/database";
import { NotFoundError } from "@stackra/errors";
import type { QueueService } from "@stackra/queue";
import { type Condition, type RuleFacts, Rules } from "@stackra/rules";
import { type FactField, FieldType, Operator } from "@stackra/rules/contracts";
import type { RuleSetService } from "@stackra/rules/node";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SegmentKind, type SegmentSubject } from "#contracts/index";
import { SegmentKindMismatchError } from "#core/index";
import { RecomputeSegmentsAction } from "#node/actions/recompute-segments.action";
import { SEGMENT_SUBJECTS } from "#node/constants/segment-subjects.constant";
import { Segment } from "#node/models/segment.model";
import { SegmentMembership } from "#node/models/segment-membership.model";
import type { SegmentMembershipService } from "#node/services/segment-membership.service";
import { SegmentService } from "#node/services/segment.service";

registerModelPartners([[SegmentService, Segment]]);

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const STORE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme.store" };
const AT = new Date("2026-10-25T09:00:00Z");
const RULE_SET = "rset_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"rset">;
const SUBJECT = "test.customer";

/** The fields segments over the test subject may test. */
const RULES = Rules.create({
  key: "test.customer_segment",
  sources: [
    {
      key: "customer",
      fields: {
        spent: { type: FieldType.Number, label: "test::facts.spent" as FactField["label"] },
      },
    },
  ],
});

/** Customers who spent at least 100. */
const BIG_SPENDERS: Condition = { field: "customer.spent", operator: Operator.AtLeast, value: 100 };

/** The model and class the registry names; the resolver hands out the fake subject for the class. */
class Customer {}
class CustomerSegmentSubject {}
SEGMENT_SUBJECTS.set(SUBJECT, {
  model: Customer,
  type: CustomerSegmentSubject as unknown as AnyClass<SegmentSubject>,
});

/** A stored segment with `data`. */
const segmentOf = (data: Partial<Segment> = {}): Segment =>
  Object.assign(new Segment(), {
    scopeId: ACME.id,
    scopePath: ACME.path,
    name: "Big spenders",
    subjectModel: SUBJECT,
    kind: SegmentKind.Dynamic,
    ruleSetId: RULE_SET,
    revision: null,
    computedAt: null,
    ...data,
  });

/** A membership of `segment` for `subjectId`. */
const memberOf = (segment: Segment, subjectId: string): SegmentMembership =>
  Object.assign(new SegmentMembership(), {
    segmentId: segment.id,
    scopeId: segment.scopeId,
    scopePath: segment.scopePath,
    subjectModel: SUBJECT,
    subjectId,
  });

/** A service over fakes: `spent` is each subject's fact, `stored` what the entity manager reads, `members` the rows. */
function setup(options: {
  readonly spent?: Readonly<Record<string, number>>;
  readonly stored?: Segment | readonly Segment[];
  readonly members?: readonly SegmentMembership[];
  readonly published?: boolean;
  readonly connected?: boolean;
}) {
  const spent = options.spent ?? {};
  const stored = options.stored ?? [];
  const subject: SegmentSubject = {
    rules: RULES,
    ids: vi.fn(async (after: string | null, limit: number) =>
      Object.keys(spent)
        .sort()
        .filter((id) => after === null || id > after)
        .slice(0, limit),
    ),
    facts: vi.fn(
      async (ids: readonly string[]) =>
        new Map<string, RuleFacts>(
          ids.flatMap((id) =>
            spent[id] === undefined ? [] : [[id, { customer: { spent: spent[id] } }] as const],
          ),
        ),
    ),
  };
  const em = {
    find: vi.fn(async (_model: unknown, _where: object) =>
      Array.isArray(stored) ? stored : [stored],
    ),
    findOneOrFail: vi.fn(async () => {
      if (Array.isArray(stored)) throw NotFoundError.create();
      return stored;
    }),
    create: vi.fn((_model: unknown, data: object) => Object.assign(new Segment(), data)),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  const ruleSets = {
    open: vi.fn(async (_scope: ScopeRef, _rules: Rules) => ({ id: RULE_SET })),
    draft: vi.fn(async (_ruleSetId: string, _rules: Rules, _condition: unknown) => 3),
    publish: vi.fn(async (_ruleSetId: string, _revision: number) => undefined),
    revision: vi.fn(async () => {
      if (options.published === false) throw NotFoundError.create();
      return { number: 2, condition: BIG_SPENDERS, publishedAt: AT };
    }),
  };
  const memberships = {
    membersOf: vi.fn(async (segment: Segment, ids?: readonly string[]) =>
      (options.members ?? []).filter(
        (row) => row.segmentId === segment.id && (ids === undefined || ids.includes(row.subjectId)),
      ),
    ),
    enter: vi.fn(async (_segment: Segment, _ids: readonly string[]) => undefined),
    leave: vi.fn(async (_rows: readonly SegmentMembership[]) => undefined),
  };
  const queue = {
    push: vi.fn(async (_type: unknown, _input: object, _options: object) => "job_1"),
  };
  const scopes: ScopeRef[] = [];
  const database = {
    withScope: vi.fn(async (scope: ScopeRef, work: () => Promise<unknown>) => {
      scopes.push(scope);
      return work();
    }),
  };
  const service = new SegmentService(
    ruleSets as unknown as RuleSetService,
    memberships as unknown as SegmentMembershipService,
    queue as unknown as QueueService,
    database as unknown as Database,
    { now: () => AT } as unknown as Clock,
  );
  const resolver: Resolver = {
    has: () => true,
    get: <T extends object>() => subject as unknown as T,
  };
  if (options.connected !== false) service.connect(resolver);
  return { service, subject, em, ruleSets, memberships, queue, scopes };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(SegmentService, () => {
  it("creates a dynamic segment with a new rule set of the subject's fields", async () => {
    const { service, ruleSets, em } = setup({});
    const segment = await service.open(ACME, {
      name: "Big spenders",
      subject: SUBJECT,
      kind: SegmentKind.Dynamic,
    });
    expect(ruleSets.open).toHaveBeenCalledWith(ACME, RULES);
    expect(em.create.mock.calls[0]?.[1]).toEqual({
      scopeId: ACME.id,
      scopePath: ACME.path,
      name: "Big spenders",
      subjectModel: SUBJECT,
      kind: SegmentKind.Dynamic,
      ruleSetId: RULE_SET,
      revision: null,
      computedAt: null,
    });
    expect(segment).toBeInstanceOf(Segment);
  });

  it("creates a manual segment with no rule set and refuses an unknown subject", async () => {
    const { service, ruleSets, em } = setup({});
    await service.open(ACME, { name: "Beta", subject: SUBJECT, kind: SegmentKind.Manual });
    expect(ruleSets.open).not.toHaveBeenCalled();
    expect(em.create.mock.calls[0]?.[1]).toMatchObject({ ruleSetId: null });
    const refused = await service
      .open(ACME, { name: "Beta", subject: "test.unknown", kind: SegmentKind.Manual })
      .catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(InputInvalidError);
    expect((refused as InputInvalidError).fieldErrors).toEqual({ subject: "subject_unknown" });
  });

  it("drafts through the rule set with the subject's fields and refuses a manual segment", async () => {
    const segment = segmentOf();
    const { service, ruleSets } = setup({ stored: segment });
    await expect(service.draft(segment.id, BIG_SPENDERS)).resolves.toBe(3);
    expect(ruleSets.draft).toHaveBeenCalledWith(RULE_SET, RULES, BIG_SPENDERS);
    const manual = segmentOf({ kind: SegmentKind.Manual, ruleSetId: null });
    const other = setup({ stored: manual });
    await expect(other.service.draft(manual.id, BIG_SPENDERS)).rejects.toBeInstanceOf(
      SegmentKindMismatchError,
    );
  });

  it("publishes a revision and queues the segment's recompute in its scope", async () => {
    const segment = segmentOf({ scopeId: STORE.id, scopePath: STORE.path });
    const { service, ruleSets, queue } = setup({ stored: segment });
    await service.publish(segment.id, 3);
    expect(ruleSets.publish).toHaveBeenCalledWith(RULE_SET, 3);
    expect(queue.push).toHaveBeenCalledWith(
      RecomputeSegmentsAction,
      { segmentId: segment.id },
      { scope: STORE },
    );
  });

  it("recomputes a segment in full: enters the matched, removes the unmatched, records the revision", async () => {
    const segment = segmentOf();
    const stale = memberOf(segment, "cus_b");
    const kept = memberOf(segment, "cus_c");
    const { service, subject, memberships } = setup({
      stored: segment,
      spent: { cus_a: 150, cus_b: 50, cus_c: 200 },
      members: [stale, kept],
    });
    await service.recompute(segment.id);
    expect(subject.ids).toHaveBeenCalledWith(null, 500);
    expect(memberships.enter).toHaveBeenCalledWith(segment, ["cus_a"]);
    expect(memberships.leave).toHaveBeenCalledWith([stale]);
    expect(segment.revision).toBe(2);
    expect(segment.computedAt).toEqual(AT);
  });

  it("keeps the members of a segment with no published revision", async () => {
    const segment = segmentOf();
    const { service, memberships } = setup({
      stored: segment,
      spent: { cus_a: 150 },
      published: false,
    });
    await service.recompute(segment.id);
    expect(memberships.enter).not.toHaveBeenCalled();
    expect(memberships.leave).not.toHaveBeenCalled();
    expect(segment.computedAt).toBeNull();
  });

  it("recomputes one subject in each segment's scope and removes a deleted subject", async () => {
    const acme = segmentOf();
    const store = segmentOf({ scopeId: STORE.id, scopePath: STORE.path });
    const member = memberOf(store, "cus_gone");
    const { service, subject, memberships, scopes } = setup({
      stored: [acme, store],
      spent: { cus_a: 150 },
      members: [member],
    });
    await service.recomputeSubject({ model: SUBJECT, id: "cus_a" });
    expect(scopes).toEqual([ACME, STORE]);
    expect(subject.ids).not.toHaveBeenCalled();
    expect(memberships.enter).toHaveBeenCalledWith(acme, ["cus_a"]);
    await service.recomputeSubject({ model: SUBJECT, id: "cus_gone" });
    expect(memberships.leave).toHaveBeenCalledWith([member]);
    expect(acme.computedAt).toBeNull();
  });

  it("adds only the subjects that are not members and refuses an unknown one", async () => {
    const segment = segmentOf({ kind: SegmentKind.Manual, ruleSetId: null });
    const { service, memberships } = setup({
      stored: segment,
      spent: { cus_a: 1, cus_b: 2 },
      members: [memberOf(segment, "cus_a")],
    });
    await service.add(segment.id, ["cus_a", "cus_b"]);
    expect(memberships.enter).toHaveBeenCalledWith(segment, ["cus_b"]);
    const refused = await service
      .add(segment.id, ["cus_b", "cus_x"])
      .catch((error: unknown) => error);
    expect((refused as InputInvalidError).fieldErrors).toEqual({
      "subjectIds.1": "subject_unknown",
    });
    expect(memberships.enter).toHaveBeenCalledTimes(1);
  });

  it("removes members of a manual segment and refuses a dynamic one", async () => {
    const segment = segmentOf({ kind: SegmentKind.Manual, ruleSetId: null });
    const member = memberOf(segment, "cus_a");
    const { service, memberships } = setup({ stored: segment, members: [member] });
    await service.remove(segment.id, ["cus_a", "cus_z"]);
    expect(memberships.leave).toHaveBeenCalledWith([member]);
    const dynamic = segmentOf();
    const other = setup({ stored: dynamic });
    await expect(other.service.remove(dynamic.id, ["cus_a"])).rejects.toBeInstanceOf(
      SegmentKindMismatchError,
    );
  });

  it("queues a recompute of every dynamic segment in its own scope", async () => {
    const acme = segmentOf();
    const store = segmentOf({ scopeId: STORE.id, scopePath: STORE.path });
    const { service, queue, em } = setup({ stored: [acme, store] });
    await expect(service.queueRecomputes()).resolves.toBe(2);
    expect(em.find.mock.calls[0]?.[1]).toEqual({ kind: SegmentKind.Dynamic });
    expect(queue.push).toHaveBeenCalledWith(
      RecomputeSegmentsAction,
      { segmentId: acme.id },
      { scope: ACME },
    );
    expect(queue.push).toHaveBeenCalledWith(
      RecomputeSegmentsAction,
      { segmentId: store.id },
      { scope: STORE },
    );
  });

  it("computes nothing before connect", async () => {
    const segment = segmentOf();
    const { service } = setup({ stored: segment, connected: false });
    await expect(service.recompute(segment.id)).rejects.toThrow(/not connected/);
  });
});
