/**
 * Stackra file contract:
 * Purpose: unit tests of `createTrait`: a trait carries its name and frozen options, adds its fields through
 *          `Model.with`, registers itself for `traitsOf`, and refuses a bad name or an `apply` that does not extend
 *          the class it is given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0096 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { createTrait } from "#core/functions/create-trait.function";
import { traitsOf } from "#core/functions/traits-of.function";
import type { ModelClass } from "#core/types/model-class.type";

const Taggable = createTrait(
  "taggable",
  (base) =>
    class extends base {
      tags: string[] = [];
    },
  { max: 10 },
);

describe(createTrait, () => {
  it("makes a named trait with frozen options", () => {
    expect(Taggable.traitName).toBe("taggable");
    expect(Taggable.options).toEqual({ max: 10 });
    expect(Object.isFrozen(Taggable.options)).toBe(true);
  });

  it("adds its fields and registers itself", () => {
    class Post extends Model.with(Taggable) {}
    expect(new Post().tags).toEqual([]);
    expect(traitsOf(Post)).toEqual([{ name: "taggable", options: { max: 10 } }]);
  });

  it("refuses a name that is not snake_case", () => {
    expect(() => createTrait("HasTags", (base) => class extends base {})).toThrow(TypeError);
    expect(() => createTrait("has__tags", (base) => class extends base {})).toThrow(TypeError);
  });

  it("refuses an apply that does not extend the class it is given", () => {
    const Broken = createTrait("broken", () => class extends Model {} as unknown as ModelClass);
    // applied after Taggable, its base is Taggable's class, not Model, so `extends Model` skips a link
    expect(() => Model.with(Taggable, Broken)).toThrow(TypeError);
  });
});
