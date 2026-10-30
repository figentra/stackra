/**
 * Stackra file contract:
 * Purpose: proves the DataGrid's pure functions: TSV round trips through spreadsheet quoting, typed parsing (Arabic
 *          digits, booleans, options by label, real days only), cell errors, the fill pattern, the undo history and
 *          the column aggregates.
 * Boundary: the pure functions alone.
 * Runtime: node
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0022 (test placement).
 */
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import { EMPTY_DATA_GRID_HISTORY } from "#core/constants/empty-data-grid-history.constant";
import { aggregateOf } from "#core/functions/aggregate-of.function";
import { changedCellCountOf } from "#core/functions/changed-cell-count-of.function";
import { dataGridReducer } from "#core/functions/data-grid-reducer.function";
import { fillPatternOf } from "#core/functions/fill-pattern-of.function";
import { gridCellErrorOf } from "#core/functions/grid-cell-error-of.function";
import { groupItemsBy } from "#core/functions/group-items-by.function";
import { parseGridValue } from "#core/functions/parse-grid-value.function";
import { parseTsv } from "#core/functions/parse-tsv.function";
import { toTsv } from "#core/functions/to-tsv.function";

const NUMBER: DataGridColumn = { id: "qty", label: "Qty", type: "number", min: 0, max: 10 };
const SELECT: DataGridColumn = {
  id: "size",
  label: "Size",
  type: "select",
  options: [{ id: "s", label: "Small" }],
};

/** An edit of the one quantity cell, from 1 to `value`. */
const edit = (value: number) => ({
  type: "edit" as const,
  edits: [{ rowId: "r", columnId: "qty", value, original: 1 }],
});

describe("toTsv and parseTsv", () => {
  it("round-trips cells holding tabs, line breaks and quotes", () => {
    const rows = [
      ["a", "b\tc"],
      ['say "hi"', "line\nbreak"],
    ];
    expect(parseTsv(toTsv(rows))).toEqual(rows);
  });

  it("reads Excel's trailing line break and CRLF", () => {
    expect(parseTsv("1\t2\r\n3\t4\r\n")).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
  });
});

describe("parseGridValue", () => {
  it("reads numbers with Arabic digits and thousands marks", () => {
    expect(parseGridValue("١٬٢٣٤٫٥", NUMBER)).toBe(1234.5);
    expect(parseGridValue("1,200", NUMBER)).toBe(1200);
    expect(parseGridValue("abc", NUMBER)).toBe("abc");
  });

  it("reads booleans, options by label and real days only", () => {
    expect(parseGridValue("نعم", { id: "b", label: "B", type: "boolean" })).toBe(true);
    expect(parseGridValue("small", SELECT)).toBe("s");
    expect(parseGridValue("2026/4/3", { id: "d", label: "D", type: "date" })).toBe("2026-04-03");
    expect(parseGridValue("2026-04-31", { id: "d", label: "D", type: "date" })).toBe("2026-04-31");
    expect(parseGridValue("  ", NUMBER)).toBeNull();
  });
});

describe("gridCellErrorOf", () => {
  it("reports type, range, required and custom errors", () => {
    expect(gridCellErrorOf("abc", NUMBER, { id: "r" })).toEqual({ kind: "type" });
    expect(gridCellErrorOf(11, NUMBER, { id: "r" })).toEqual({ kind: "max", limit: 10 });
    expect(gridCellErrorOf(null, { ...NUMBER, isRequired: true }, { id: "r" })).toEqual({
      kind: "required",
    });
    expect(gridCellErrorOf(3, { ...NUMBER, validate: () => "Odd" }, { id: "r" })).toEqual({
      kind: "custom",
      message: "Odd",
    });
    expect(gridCellErrorOf(3, NUMBER, { id: "r" })).toBeUndefined();
  });
});

describe("fillPatternOf", () => {
  it("repeats the source block over the target", () => {
    expect(fillPatternOf([[1, 2]], 2, 3)).toEqual([
      [1, 2, 1],
      [1, 2, 1],
    ]);
  });
});

describe("dataGridReducer", () => {
  it("records one step per batch, undoes, redoes and drops edits back to the saved value", () => {
    const one = dataGridReducer(EMPTY_DATA_GRID_HISTORY, edit(2));
    expect(one.changes).toEqual({ r: { qty: 2 } });
    expect(changedCellCountOf(one.changes)).toBe(1);
    const back = dataGridReducer(one, edit(1));
    expect(back.changes).toEqual({});
    const undone = dataGridReducer(back, { type: "undo" });
    expect(undone.changes).toEqual({ r: { qty: 2 } });
    expect(dataGridReducer(undone, { type: "redo" }).changes).toEqual({});
    expect(dataGridReducer(one, edit(2))).toBe(one);
  });
});

describe("aggregateOf and groupItemsBy", () => {
  it("totals numbers and groups rows in first-seen order", () => {
    expect(aggregateOf([1, 2, "x"], "sum")).toBe(3);
    expect(aggregateOf([1, 3], "avg")).toBe(2);
    expect(aggregateOf([], "max")).toBeNull();
    expect(aggregateOf([1, "x"], "count")).toBe(2);
    const groups = groupItemsBy(
      [
        { id: "1", status: "Paid" },
        { id: "2", status: "Due" },
        { id: "3", status: "Paid" },
      ],
      "status",
    );
    expect(groups.map((group) => [group.key, group.items.length])).toEqual([
      ["Paid", 2],
      ["Due", 1],
    ]);
  });
});
