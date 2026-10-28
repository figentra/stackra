/**
 * Stackra file contract:
 * Purpose: unit tests of `treePath` and `isTree`: a root's path is its id, a child's is under its parent's, an id that
 *          is not an `ltree` label is refused, and only a `HasTree` model is a tree.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0321 (`HasTree`); ADR 0160; ADR 0022; data-layer gap mo16.
 */
import { HasPublicId, HasTree, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { isTree } from "#core/functions/is-tree.function";
import { treePath } from "#core/functions/tree-path.function";

class Category extends Model.with(HasPublicId("cat"), HasTree) {}

class Plain extends Model.with(HasPublicId("pln")) {}

describe(treePath, () => {
  it("puts a record under its parent's path, or alone as a root", () => {
    expect(treePath(undefined, "cat_a")).toBe("cat_a");
    expect(treePath("cat_a.cat_b", "cat_c")).toBe("cat_a.cat_b.cat_c");
  });

  it("refuses an id that is not an ltree label", () => {
    expect(() => treePath(undefined, "cat.a")).toThrow(TypeError);
    expect(() => treePath("cat_a", "")).toThrow(TypeError);
  });
});

describe(isTree, () => {
  it("knows a HasTree model", () => {
    expect(isTree(Category)).toBe(true);
    expect(isTree(Plain)).toBe(false);
  });
});
