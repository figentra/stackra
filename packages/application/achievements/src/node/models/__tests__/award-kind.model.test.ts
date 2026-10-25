/**
 * Stackra file contract:
 * Purpose: unit and type tests of `AwardKind`: a model with the `awk` public id and the timestamps, no `@Index`, and
 *          its levels, flags, criteria link and template typed as the table stores them.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decisions 1 to 4); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AwardKind } from "#node/models/award-kind.model";

describe("AwardKind", () => {
  it("is a model with the awk public id and the timestamps", () => {
    expect(new AwardKind()).toBeInstanceOf(Model);
    expect(traitsOf(AwardKind).map((trait) => trait.name)).toEqual(["has_public_id", "timestamps"]);
    expect(traitsOf(AwardKind)[0]?.options).toEqual({ prefix: "awk" });
    expect(new AwardKind().id).toMatch(/^awk_[0-9a-z]{26}$/);
  });

  it("leaves its indexes to the migration and types its definition", () => {
    expect(Index.on(AwardKind)).toEqual([]);
    expectTypeOf<AwardKind["scopeId"]>().toEqualTypeOf<PublicId<"scp">>();
    expectTypeOf<AwardKind["levels"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<AwardKind["isAscending"]>().toEqualTypeOf<boolean>();
    expectTypeOf<AwardKind["ruleSetId"]>().toEqualTypeOf<PublicId<"rset"> | null>();
    expectTypeOf<AwardKind["certificateTemplate"]>().toEqualTypeOf<string | null>();
  });
});
