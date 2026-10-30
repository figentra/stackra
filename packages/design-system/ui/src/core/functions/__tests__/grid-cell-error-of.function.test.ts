/**
 * Stackra file contract:
 * Purpose: proves `gridCellErrorOf` per rule: required (and optional) empties, the wrong type for number, boolean,
 *          select and date columns, the min and max limits, a custom rule reading the row, and a fine value.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0022 (test placement); STA-1371.
 */
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";
import { gridCellErrorOf } from "#core/functions/grid-cell-error-of.function";

const ROW = { id: "r1", qty: 3 };
const col = (extra: Partial<DataGridColumn>): DataGridColumn => ({ id: "c", label: "C", ...extra });

describe("gridCellErrorOf", () => {
  it.each([null, undefined, ""] as const)("asks for a required value for %j", (value) => {
    expect(gridCellErrorOf(value, col({ isRequired: true }), ROW)).toEqual({ kind: "required" });
    expect(gridCellErrorOf(value, col({}), ROW)).toBeUndefined();
  });

  it.each<[DataGridValue, Partial<DataGridColumn>]>([
    ["12x", { type: "number" }],
    ["yes", { type: "boolean" }],
    ["m", { type: "select", options: [{ id: "s", label: "Small" }] }],
    ["s", { type: "select" }],
    [5, { type: "date" }],
    ["2026/04/03", { type: "date" }],
  ])("flags %j as the wrong type for %o", (value, extra) => {
    expect(gridCellErrorOf(value, col(extra), ROW)).toEqual({ kind: "type" });
  });

  it("accepts a value of the right type", () => {
    expect(gridCellErrorOf(true, col({ type: "boolean" }), ROW)).toBeUndefined();
    expect(gridCellErrorOf("2026-04-03", col({ type: "date" }), ROW)).toBeUndefined();
    expect(
      gridCellErrorOf("s", col({ type: "select", options: [{ id: "s", label: "Small" }] }), ROW),
    ).toBeUndefined();
    expect(gridCellErrorOf("free", col({}), ROW)).toBeUndefined();
  });

  it("checks a number against min and max", () => {
    const limited = col({ type: "number", min: 1, max: 10 });
    expect(gridCellErrorOf(0, limited, ROW)).toEqual({ kind: "min", limit: 1 });
    expect(gridCellErrorOf(11, limited, ROW)).toEqual({ kind: "max", limit: 10 });
    expect(gridCellErrorOf(1, limited, ROW)).toBeUndefined();
    expect(gridCellErrorOf(10, limited, ROW)).toBeUndefined();
    expect(gridCellErrorOf(-99, col({ type: "number" }), ROW)).toBeUndefined();
  });

  it("runs the custom rule with the row and keeps a passing value", () => {
    const validate = vi.fn((value: DataGridValue, row: { readonly id: string }) =>
      value === "bad" ? `no in ${row.id}` : undefined,
    );
    expect(gridCellErrorOf("bad", col({ validate }), ROW)).toEqual({
      kind: "custom",
      message: "no in r1",
    });
    expect(gridCellErrorOf("good", col({ validate }), ROW)).toBeUndefined();
    expect(validate).toHaveBeenCalledWith("good", ROW);
  });
});
