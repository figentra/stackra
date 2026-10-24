/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ScopeNode`: a model with the `scp` public id and the timestamps, no `@Index` (the
 *          path's indexes are the migration's), a fresh `scp_` id per created row, and text fields for the level, the
 *          path and the name.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 2 and 3); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ScopeNode } from "#node/models/scope-node.model";

describe("ScopeNode", () => {
  it("is a model with the scp public id and the timestamps", () => {
    expect(new ScopeNode()).toBeInstanceOf(Model);
    expect(traitsOf(ScopeNode).map((trait) => trait.name)).toEqual(["has_public_id", "timestamps"]);
    expect(traitsOf(ScopeNode)[0]?.options).toEqual({ prefix: "scp" });
  });

  it("mints a fresh scp id per created row", () => {
    const first = new ScopeNode();
    expect(first.id).toMatch(/^scp_[0-9a-z]{26}$/);
    expect(new ScopeNode().id).not.toBe(first.id);
    expectTypeOf(first.id).toEqualTypeOf<PublicId<"scp">>();
  });

  it("leaves the path's indexes to the migration and keeps the level as text", () => {
    expect(Index.on(ScopeNode)).toEqual([]);
    expectTypeOf<ScopeNode["level"]>().toEqualTypeOf<string>();
    expectTypeOf<ScopeNode["scopePath"]>().toEqualTypeOf<string>();
    expectTypeOf<ScopeNode["name"]>().toEqualTypeOf<string>();
  });
});
