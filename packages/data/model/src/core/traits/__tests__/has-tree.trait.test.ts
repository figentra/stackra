/**
 * Stackra file contract:
 * Purpose: unit tests of `HasTree`: a new record is a root with no path yet, the model is marked, and its path is a
 *          system field.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0321 (decision 4); data-layer gap mo16.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { systemFieldsOf } from "#core/functions/system-fields-of.function";
import { traitsOf } from "#core/functions/traits-of.function";
import { HasTree } from "#core/traits/has-tree.trait";

class Category extends Model.with(HasTree) {}

describe("HasTree", () => {
  it("starts a record as a root whose path the database writes", () => {
    const category = new Category();
    expect(category.parentId).toBeNull();
    expect(category.treePath).toBe("");
    expect(traitsOf(Category)).toEqual([{ name: "has_tree", options: {} }]);
    expect(systemFieldsOf(Category)).toEqual(["treePath"]);
  });
});
