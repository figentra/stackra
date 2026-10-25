/**
 * Stackra file contract:
 * Purpose: unit and type tests of `AwardVerification`: a model with the `awv` public id and the timestamps, no
 *          `@Index`, holding a token hash, an award id and a scope.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decision 5); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AwardVerification } from "#node/models/award-verification.model";

describe("AwardVerification", () => {
  it("is a model with the awv public id and the timestamps", () => {
    expect(new AwardVerification()).toBeInstanceOf(Model);
    expect(traitsOf(AwardVerification)[0]?.options).toEqual({ prefix: "awv" });
    expect(new AwardVerification().id).toMatch(/^awv_[0-9a-z]{26}$/);
  });

  it("leaves its indexes to the migration and types its definition", () => {
    expect(Index.on(AwardVerification)).toEqual([]);
    expectTypeOf<AwardVerification["tokenHash"]>().toEqualTypeOf<string>();
    expectTypeOf<AwardVerification["awardId"]>().toEqualTypeOf<PublicId<"awd">>();
    expectTypeOf<AwardVerification["scopeId"]>().toEqualTypeOf<PublicId<"scp">>();
  });
});
