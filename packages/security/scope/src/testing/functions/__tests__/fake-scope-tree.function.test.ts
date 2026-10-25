/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeScopeTree`: it holds every path and its ancestors with `scopeRefOf` ids, names nodes by
 *          their last label, sets the level by depth (repeating the deepest), and answers the `ScopeTree` reads.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327.
 */
import { describe, expect, it } from "@stackra/testing";

import { ScopeTree } from "#contracts/index";
import { fakeScopeTree } from "#testing/functions/fake-scope-tree.function";
import { scopeRefOf } from "#testing/functions/scope-ref-of.function";

describe("fakeScopeTree", () => {
  it("holds the paths and their ancestors at their levels", async () => {
    const tree = fakeScopeTree(["platform.acme.shop_eu"], ["platform", "product", "store"]);
    expect(tree).toBeInstanceOf(ScopeTree);
    expect(await tree.byPath("platform.acme")).toEqual({
      ...scopeRefOf("platform.acme"),
      level: "product",
      name: "acme",
    });
    expect((await tree.node(scopeRefOf("platform.acme.shop_eu").id))?.level).toBe("store");
    expect(await tree.descendants(scopeRefOf("platform"))).toHaveLength(2);
  });

  it("repeats the deepest level and refuses no levels", async () => {
    const tree = fakeScopeTree(["platform.a.b.c"], ["platform", "node"]);
    expect((await tree.byPath("platform.a.b.c"))?.level).toBe("node");
    expect(() => fakeScopeTree(["platform"], [])).toThrow(RangeError);
  });
});
