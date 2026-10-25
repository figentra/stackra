/**
 * Stackra file contract:
 * Purpose: unit tests of `Taggable`: a new record has no tags, each record has its own list, and the model is marked.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0321 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { Taggable } from "#core/traits/taggable.trait";

class Customer extends Model.with(Taggable) {}

describe("Taggable", () => {
  it("starts each record with its own empty tag list", () => {
    const first = new Customer();
    first.tags.push("vip");
    expect(new Customer().tags).toEqual([]);
    expect(first.tags).toEqual(["vip"]);
    expect(traitsOf(Customer)).toEqual([{ name: "taggable", options: {} }]);
  });
});
