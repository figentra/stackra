/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Revision`: a model with the `rev` public id and the timestamps, a fresh id per row,
 *          a draft until published, and the types of its scope, record, number and snapshot fields.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0321 (decision 2); ADR 0327 (decision 3); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Revision } from "#node/models/revision.model";

describe("Revision", () => {
  it("is a model with the rev public id and the timestamps", () => {
    expect(new Revision()).toBeInstanceOf(Model);
    expect(traitsOf(Revision).map((trait) => trait.name)).toEqual(["has_public_id", "timestamps"]);
    expect(traitsOf(Revision)[0]?.options).toEqual({ prefix: "rev" });
  });

  it("mints a fresh rev id per row and starts as a draft", () => {
    const first = new Revision();
    expect(first.id).toMatch(/^rev_[0-9a-z]{26}$/);
    expect(new Revision().id).not.toBe(first.id);
    expect(first.publishedAt).toBeNull();
  });

  it("types its scope, its record, its number and its snapshot", () => {
    expectTypeOf<Revision["scopeId"]>().toEqualTypeOf<PublicId<"scp">>();
    expectTypeOf<Revision["number"]>().toEqualTypeOf<number>();
    expectTypeOf<Revision["data"]>().toEqualTypeOf<Readonly<Record<string, unknown>>>();
    expectTypeOf<Revision["publishedAt"]>().toEqualTypeOf<Date | null>();
  });
});
