/**
 * Stackra file contract:
 * Purpose: unit tests of `SegmentMembershipService`: `has` counts the segment and subject; `segmentsOf` reads the
 *          subject's segments as audiences; `members` pages a segment's subject ids in order; `membersOf` reads all or
 *          some rows of a segment; `enter` creates one row per new subject in the segment's scope with
 *          `MembershipEntered` and flushes; `leave` records `MembershipLeft`, removes each row and flushes; both do
 *          nothing for an empty list.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decisions 3 to 5).
 */
import { Database, registerModelPartners } from "@stackra/database";
import { takeRecordedEvents } from "@stackra/events";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SegmentKind } from "#contracts/index";
import { MembershipEntered, MembershipLeft } from "#core/index";
import { Segment } from "#node/models/segment.model";
import { SegmentMembership } from "#node/models/segment-membership.model";
import { SegmentMembershipService } from "#node/services/segment-membership.service";

registerModelPartners([[SegmentMembershipService, SegmentMembership]]);

const SUBJECT = { model: "commerce.customer", id: "cus_01j9z3k4m5n6p7q8r9s0t1v2w4" };

/** A dynamic segment of the acme scope. */
const SEGMENT = Object.assign(new Segment(), {
  scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  scopePath: "platform.acme",
  name: "Big spenders",
  subjectModel: SUBJECT.model,
  kind: SegmentKind.Dynamic,
  ruleSetId: null,
  revision: null,
  computedAt: null,
});

/** A membership of `SEGMENT` for `subjectId`. */
const memberOf = (subjectId: string): SegmentMembership =>
  Object.assign(new SegmentMembership(), {
    segmentId: SEGMENT.id,
    scopeId: SEGMENT.scopeId,
    scopePath: SEGMENT.scopePath,
    subjectModel: SUBJECT.model,
    subjectId,
  });

/** Connects a recording entity manager whose `find` answers `rows` and `count` answers `count`. */
function connect(rows: SegmentMembership[] = [], count = 0) {
  const em = {
    find: vi.fn(async (_model: unknown, _where: object, _options?: object) => rows),
    count: vi.fn(async (_model: unknown, _where: object) => count),
    create: vi.fn((_model: unknown, data: object) => Object.assign(new SegmentMembership(), data)),
    remove: vi.fn((_row: object) => undefined),
    flush: vi.fn(async () => undefined),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return em;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(SegmentMembershipService, () => {
  it("tells whether a subject is a member", async () => {
    const em = connect([], 1);
    const service = new SegmentMembershipService();
    await expect(service.has({ kind: "segment", id: SEGMENT.id }, SUBJECT)).resolves.toBe(true);
    expect(em.count.mock.calls[0]?.[1]).toEqual({
      segmentId: SEGMENT.id,
      subjectModel: SUBJECT.model,
      subjectId: SUBJECT.id,
    });
    connect([], 0);
    await expect(service.has({ kind: "segment", id: SEGMENT.id }, SUBJECT)).resolves.toBe(false);
  });

  it("reads a subject's segments as audiences", async () => {
    const em = connect([memberOf(SUBJECT.id)]);
    await expect(new SegmentMembershipService().segmentsOf(SUBJECT)).resolves.toEqual([
      { kind: "segment", id: SEGMENT.id },
    ]);
    expect(em.find.mock.calls[0]?.[1]).toEqual({
      subjectModel: SUBJECT.model,
      subjectId: SUBJECT.id,
    });
  });

  it("pages a segment's members in order after a cursor", async () => {
    const em = connect([memberOf("cus_b"), memberOf("cus_c")]);
    const service = new SegmentMembershipService();
    await expect(
      service.members({ kind: "segment", id: SEGMENT.id }, { after: "cus_a", limit: 2 }),
    ).resolves.toEqual(["cus_b", "cus_c"]);
    expect(em.find.mock.calls[0]?.slice(1)).toEqual([
      { segmentId: SEGMENT.id, subjectId: { $gt: "cus_a" } },
      { orderBy: { subjectId: "asc" }, limit: 2 },
    ]);
    await service.members({ kind: "segment", id: SEGMENT.id }, { limit: 10 });
    expect(em.find.mock.calls[1]?.[1]).toEqual({ segmentId: SEGMENT.id });
  });

  it("reads all or some of a segment's memberships", async () => {
    const em = connect();
    const service = new SegmentMembershipService();
    await service.membersOf(SEGMENT);
    await service.membersOf(SEGMENT, ["cus_a"]);
    expect(em.find.mock.calls[0]?.[1]).toEqual({ segmentId: SEGMENT.id });
    expect(em.find.mock.calls[1]?.[1]).toEqual({
      segmentId: SEGMENT.id,
      subjectId: { $in: ["cus_a"] },
    });
  });

  it("enters each new subject once, in the segment's scope, with MembershipEntered", async () => {
    const em = connect();
    await new SegmentMembershipService().enter(SEGMENT, ["cus_a", "cus_a", "cus_b"]);
    expect(em.create).toHaveBeenCalledTimes(2);
    expect(em.create.mock.calls[0]?.[1]).toEqual({
      segmentId: SEGMENT.id,
      scopeId: SEGMENT.scopeId,
      scopePath: SEGMENT.scopePath,
      subjectModel: SUBJECT.model,
      subjectId: "cus_a",
    });
    const row = em.create.mock.results[0]?.value as SegmentMembership;
    expect(takeRecordedEvents(row)).toEqual([
      MembershipEntered.create({
        segmentId: SEGMENT.id,
        subjectModel: SUBJECT.model,
        subjectId: "cus_a",
      }),
    ]);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it("removes each membership with MembershipLeft", async () => {
    const em = connect();
    const row = memberOf("cus_a");
    await new SegmentMembershipService().leave([row]);
    expect(takeRecordedEvents(row)).toEqual([
      MembershipLeft.create({
        segmentId: SEGMENT.id,
        subjectModel: SUBJECT.model,
        subjectId: "cus_a",
      }),
    ]);
    expect(em.remove).toHaveBeenCalledWith(row);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it("writes nothing for an empty list", async () => {
    const em = connect();
    const service = new SegmentMembershipService();
    await service.enter(SEGMENT, []);
    await service.leave([]);
    expect(em.create).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });
});
