/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SegmentMembership`: a model with the `sgm` public id and the timestamps, no `@Index`,
 *          naming its segment and its subject by model key and public id, and recording events like every model.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decisions 3 and 4); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { takeRecordedEvents } from "@stackra/events";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MembershipEntered } from "#core/index";
import { SegmentMembership } from "#node/models/segment-membership.model";

describe("SegmentMembership", () => {
  it("is a model with the sgm public id and the timestamps", () => {
    expect(new SegmentMembership()).toBeInstanceOf(Model);
    expect(traitsOf(SegmentMembership).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "timestamps",
    ]);
    expect(traitsOf(SegmentMembership)[0]?.options).toEqual({ prefix: "sgm" });
    expect(Index.on(SegmentMembership)).toEqual([]);
  });

  it("names its segment and subject and records a membership event", () => {
    expectTypeOf<SegmentMembership["segmentId"]>().toEqualTypeOf<PublicId<"seg">>();
    expectTypeOf<SegmentMembership["subjectModel"]>().toEqualTypeOf<string>();
    expectTypeOf<SegmentMembership["subjectId"]>().toEqualTypeOf<string>();
    const row = new SegmentMembership();
    const event = MembershipEntered.create({
      segmentId: "seg_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"seg">,
      subjectModel: "commerce.customer",
      subjectId: "cus_01j9z3k4m5n6p7q8r9s0t1v2w4",
    });
    row.record(event);
    expect(takeRecordedEvents(row)).toEqual([event]);
  });
});
