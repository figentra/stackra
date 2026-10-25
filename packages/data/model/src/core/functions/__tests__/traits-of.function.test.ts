/**
 * Stackra file contract:
 * Purpose: unit tests of `traitsOf`: the traits of a model in application order, with their options, inherited by a
 *          subclass, and none for a class that was not composed with traits.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0096 (the trait registry).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { AppendOnly } from "#core/traits/append-only.trait";
import { HasPublicId } from "#core/traits/has-public-id.trait";

class LedgerEntry extends Model.with(HasPublicId("lpe"), AppendOnly) {}

class CorrectionEntry extends LedgerEntry {}

describe(traitsOf, () => {
  it("lists the traits first applied first, with their options", () => {
    expect(traitsOf(LedgerEntry)).toEqual([
      { name: "has_public_id", options: { prefix: "lpe" } },
      { name: "append_only", options: {} },
    ]);
  });

  it("reads a subclass through its ancestors", () => {
    expect(traitsOf(CorrectionEntry).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "append_only",
    ]);
  });

  it("returns a frozen empty list for a class without traits", () => {
    const traits = traitsOf(class Plain {});
    expect(traits).toEqual([]);
    expect(Object.isFrozen(traits)).toBe(true);
  });
});
