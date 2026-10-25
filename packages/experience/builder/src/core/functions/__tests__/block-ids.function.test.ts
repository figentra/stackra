/**
 * Stackra file contract:
 * Purpose: unit tests of `blockIds`: every id of a subtree, the node's own included, collected into a given set.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import type { EditorNode } from "#contracts/index";
import { blockIds } from "#core/functions/block-ids.function";

/** A block with no props. */
function node(id: string, children: readonly EditorNode[] = []): EditorNode {
  return { id, block: "web.box", props: {}, children };
}

describe("blockIds", () => {
  it("collects the subtree's ids depth-first", () => {
    expect([...blockIds(node("a", [node("b", [node("c")]), node("d")]))]).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("adds to the set it is given", () => {
    const into = new Set(["x"]);
    expect(blockIds(node("a"), into)).toBe(into);
    expect([...into]).toEqual(["x", "a"]);
  });
});
