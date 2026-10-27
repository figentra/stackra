/**
 * Stackra file contract:
 * Purpose: unit tests of `workflowLayout`: a chain runs left to right, a branch shares a column, a join waits for its
 *          longest path in, unknown edges and self-loops are ignored, and a cycle still ends.
 * Boundary: test only; the graphs are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); OS-230 (graph canvas).
 */
import { workflowLayout } from "#core/functions/workflow-layout.function";

const node = (id: string) => ({ id, title: id });

describe("workflowLayout", () => {
  it("lays a chain out left to right", () => {
    const layout = workflowLayout(
      [node("trigger"), node("a"), node("b")],
      [
        { from: "trigger", to: "a" },
        { from: "a", to: "b" },
      ],
    );
    expect(layout.placements.get("b")).toEqual({ layer: 2, row: 0 });
    expect(layout).toMatchObject({ layers: 3, rows: 1 });
  });

  it("puts branches in one column and a join after its longest path in", () => {
    const layout = workflowLayout(
      [node("t"), node("paid"), node("unpaid"), node("remind"), node("close")],
      [
        { from: "t", to: "paid", label: "if paid" },
        { from: "t", to: "unpaid", label: "if not paid" },
        { from: "unpaid", to: "remind" },
        { from: "paid", to: "close" },
        { from: "remind", to: "close" },
      ],
    );
    expect(layout.placements.get("paid")).toEqual({ layer: 1, row: 0 });
    expect(layout.placements.get("unpaid")).toEqual({ layer: 1, row: 1 });
    expect(layout.placements.get("close")).toEqual({ layer: 3, row: 0 });
    expect(layout).toMatchObject({ layers: 4, rows: 2 });
  });

  it("ignores unknown nodes and self-loops", () => {
    const layout = workflowLayout(
      [node("a"), node("b")],
      [
        { from: "a", to: "a" },
        { from: "ghost", to: "b" },
      ],
    );
    expect(layout.placements.get("a")).toEqual({ layer: 0, row: 0 });
    expect(layout.placements.get("b")).toEqual({ layer: 0, row: 1 });
  });

  it("ends on a cycle", () => {
    const layout = workflowLayout(
      [node("t"), node("a"), node("b")],
      [
        { from: "t", to: "a" },
        { from: "a", to: "b" },
        { from: "b", to: "a" },
      ],
    );
    expect(layout.placements.size).toBe(3);
    expect(layout.placements.get("t")).toEqual({ layer: 0, row: 0 });
    expect(layout.placements.get("a")?.layer).toBe(1);
    expect(layout.placements.get("b")?.layer).toBe(2);
  });

  it("is empty for no nodes", () => {
    expect(workflowLayout([], [])).toMatchObject({ layers: 0, rows: 0 });
  });
});
