/**
 * Stackra file contract:
 * Purpose: proves `cascadeColumnsOf` lists the top rows, then the rows under each step of the path, names the rows of
 *          the path, reads loaded rows, and stops at a leaf or an unknown step.
 * Boundary: pure function test.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { cascadeColumnsOf } from "#core/functions/cascade-columns-of.function";

const ITEMS: readonly TreeViewNode[] = [
  {
    id: "sa",
    label: "Saudi Arabia",
    children: [{ id: "ruh", label: "Riyadh", children: [{ id: "olaya", label: "Al Olaya" }] }],
  },
  { id: "ae", label: "UAE", hasChildren: true },
];

describe("cascadeColumnsOf", () => {
  it("shows only the top rows for an empty path", () => {
    expect(cascadeColumnsOf(ITEMS, [])).toEqual({ columns: [ITEMS], nodes: [] });
  });

  it("opens a column under each step and stops at the leaf", () => {
    const { columns, nodes } = cascadeColumnsOf(ITEMS, ["sa", "ruh", "olaya"]);
    expect(columns.map((column) => column.map((row) => row.id))).toEqual([
      ["sa", "ae"],
      ["ruh"],
      ["olaya"],
    ]);
    expect(nodes.map((node) => node.label)).toEqual(["Saudi Arabia", "Riyadh", "Al Olaya"]);
  });

  it("reads rows loaded for a lazy row and ignores an unknown step", () => {
    const loaded = new Map([["ae", [{ id: "dxb", label: "Dubai" }]]]);
    expect(cascadeColumnsOf(ITEMS, ["ae"], loaded).columns[1]?.[0]?.label).toBe("Dubai");
    expect(cascadeColumnsOf(ITEMS, ["ae"]).columns).toHaveLength(1);
    expect(cascadeColumnsOf(ITEMS, ["nope", "ruh"]).nodes).toEqual([]);
  });
});
