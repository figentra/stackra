/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Award`: a model with the `awd` public id and the timestamps, no `@Index`, and its
 *          kind, grant and revoke fields typed as the table stores them.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decisions 2 to 5); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Award } from "#node/models/award.model";

describe("Award", () => {
  it("is a model with the awd public id and the timestamps", () => {
    expect(new Award()).toBeInstanceOf(Model);
    expect(traitsOf(Award).map((trait) => trait.name)).toEqual(["has_public_id", "timestamps"]);
    expect(traitsOf(Award)[0]?.options).toEqual({ prefix: "awd" });
    expect(new Award().id).toMatch(/^awd_[0-9a-z]{26}$/);
  });

  it("leaves its indexes to the migration and types its definition", () => {
    expect(Index.on(Award)).toEqual([]);
    expectTypeOf<Award["kindId"]>().toEqualTypeOf<PublicId<"awk">>();
    expectTypeOf<Award["grantedBy"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Award["ruleRevision"]>().toEqualTypeOf<number | null>();
    expectTypeOf<Award["verifyToken"]>().toEqualTypeOf<string>();
    expectTypeOf<Award["revokedAt"]>().toEqualTypeOf<Date | null>();
  });
});
