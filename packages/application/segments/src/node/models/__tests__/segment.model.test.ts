/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Segment`: a model with the `seg` public id and the timestamps, no `@Index`, and its
 *          kind, rule set link and last computation typed as the table stores them.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decisions 1 to 3); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { SegmentKind } from "#contracts/index";
import { Segment } from "#node/models/segment.model";

describe("Segment", () => {
  it("is a model with the seg public id and the timestamps", () => {
    expect(new Segment()).toBeInstanceOf(Model);
    expect(traitsOf(Segment).map((trait) => trait.name)).toEqual(["has_public_id", "timestamps"]);
    expect(traitsOf(Segment)[0]?.options).toEqual({ prefix: "seg" });
    expect(new Segment().id).toMatch(/^seg_[0-9a-z]{26}$/);
  });

  it("leaves its indexes to the migration and types its definition", () => {
    expect(Index.on(Segment)).toEqual([]);
    expectTypeOf<Segment["scopeId"]>().toEqualTypeOf<PublicId<"scp">>();
    expectTypeOf<Segment["kind"]>().toEqualTypeOf<SegmentKind>();
    expectTypeOf<Segment["ruleSetId"]>().toEqualTypeOf<PublicId<"rset"> | null>();
    expectTypeOf<Segment["revision"]>().toEqualTypeOf<number | null>();
    expectTypeOf<Segment["computedAt"]>().toEqualTypeOf<Date | null>();
  });
});
