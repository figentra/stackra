/**
 * Stackra file contract:
 * Purpose: unit tests of `Translatable`: it records the per-locale field names, adds no field, and refuses an empty
 *          or repeated list.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0162 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { Translatable } from "#core/traits/translatable.trait";
import type { Translated } from "#core/values/translated.value";

class ProductCollection extends Model.with(Translatable(["title"])) {
  title!: Translated;
}

describe(Translatable, () => {
  it("records the field names", () => {
    expect(traitsOf(ProductCollection)).toEqual([
      { name: "translatable", options: { fields: ["title"] } },
    ]);
    expect(Object.keys(new ProductCollection())).toEqual(["title"]);
  });

  it("refuses an empty or repeated list", () => {
    expect(() => Translatable([])).toThrow(TypeError);
    expect(() => Translatable(["title", "title"])).toThrow(TypeError);
  });
});
