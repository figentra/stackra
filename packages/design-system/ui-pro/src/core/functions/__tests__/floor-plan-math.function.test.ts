/**
 * Stackra file contract:
 * Purpose: unit tests of the floor-plan math: `moveFloorItem` rounds to whole cells and keeps the item inside the
 *          plan with its size; `resizeFloorItem` rounds, keeps one cell at least and stays inside the plan.
 * Boundary: test only; the plan and items are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0310 (decision 3).
 */
import { moveFloorItem } from "#core/functions/move-floor-item.function";
import { resizeFloorItem } from "#core/functions/resize-floor-item.function";

const bounds = { columns: 10, rows: 8 };
const table = {
  id: "t1",
  shape: "rectangle" as const,
  label: "T1",
  x: 2,
  y: 3,
  width: 2,
  height: 2,
};

describe("floor-plan math", () => {
  it("moves by whole cells and stays inside the plan", () => {
    expect(moveFloorItem(table, 1.4, -0.6, bounds)).toMatchObject({ x: 3, y: 2, width: 2 });
    expect(moveFloorItem(table, -9, -9, bounds)).toMatchObject({ x: 0, y: 0 });
    expect(moveFloorItem(table, 99, 99, bounds)).toMatchObject({ x: 8, y: 6 });
  });

  it("resizes by whole cells, one cell at least, inside the plan", () => {
    expect(resizeFloorItem(table, 1.2, 0, bounds)).toMatchObject({ width: 3, height: 2, x: 2 });
    expect(resizeFloorItem(table, -5, -5, bounds)).toMatchObject({ width: 1, height: 1 });
    expect(resizeFloorItem(table, 99, 99, bounds)).toMatchObject({ width: 8, height: 5 });
  });
});
