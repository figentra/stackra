/**
 * Stackra file contract:
 * Purpose: proves `propagateTreeSelection` carries a check down to every enabled row under it and up to a parent whose
 *          rows are all checked, `treeCheckStateOf` reads a partly checked parent as `some`, and `moveTreeNodes` moves
 *          rows before, after and inside a target and refuses a drop into a moved row.
 * Boundary: pure functions.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave C).
 */
import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { moveTreeNodes } from "#core/functions/move-tree-nodes.function";
import { propagateTreeSelection } from "#core/functions/propagate-tree-selection.function";
import { treeCheckStateOf } from "#core/functions/tree-check-state-of.function";

const TREE: readonly TreeViewNode[] = [
  {
    id: "assets",
    label: "Assets",
    children: [
      { id: "cash", label: "Cash" },
      { id: "bank", label: "Bank" },
      { id: "locked", label: "Locked", isDisabled: true },
    ],
  },
  { id: "revenue", label: "Revenue" },
];

describe("propagateTreeSelection", () => {
  it("checks a parent's enabled rows, and the parent once all its rows are", () => {
    expect(propagateTreeSelection(TREE, [], ["assets"])).toEqual(["cash", "bank"]);
    expect(propagateTreeSelection(TREE, ["locked"], ["locked", "cash", "bank"])).toEqual([
      "assets",
      "cash",
      "bank",
      "locked",
    ]);
  });

  it("unchecks the parent when one of its rows is unchecked", () => {
    const all = ["assets", "cash", "bank", "locked"];
    expect(propagateTreeSelection(TREE, all, ["assets", "bank", "locked"])).toEqual([
      "bank",
      "locked",
    ]);
  });
});

describe("treeCheckStateOf", () => {
  it("reads on, some and off", () => {
    const [assets] = TREE;
    if (!assets) throw new Error("no tree");
    expect(treeCheckStateOf(assets, new Set(["cash"]))).toBe("some");
    expect(treeCheckStateOf(assets, new Set(["cash", "bank", "locked"]))).toBe("on");
    expect(treeCheckStateOf(assets, new Set())).toBe("off");
  });
});

/** The tree's ids, nested as the rows are. */
const ids = (nodes: readonly TreeViewNode[]): unknown =>
  nodes.map((node) => (node.children ? [node.id, ids(node.children)] : node.id));

describe("moveTreeNodes", () => {
  it("moves rows before, after and inside a target", () => {
    expect(ids(moveTreeNodes(TREE, ["revenue"], { id: "cash", position: "before" }))).toEqual([
      ["assets", ["revenue", "cash", "bank", "locked"]],
    ]);
    expect(ids(moveTreeNodes(TREE, ["cash"], { id: "revenue", position: "after" }))).toEqual([
      ["assets", ["bank", "locked"]],
      "revenue",
      "cash",
    ]);
    expect(ids(moveTreeNodes(TREE, ["bank"], { id: "revenue", position: "inside" }))).toEqual([
      ["assets", ["cash", "locked"]],
      ["revenue", ["bank"]],
    ]);
  });

  it("refuses a drop into a moved row", () => {
    expect(moveTreeNodes(TREE, ["assets"], { id: "cash", position: "inside" })).toBe(TREE);
  });
});
