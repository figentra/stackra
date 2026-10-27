/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryTabularReaderDriver`: rows numbered from 1 per sheet with cells as text, the sheet
 *          filter and the row limit across sheets.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266; ADR 0367 (decisions 2 to 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { TabularReader } from "#contracts/ports/tabular-reader.port";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import { MemoryTabularReaderDriver } from "#core/drivers/memory-tabular-reader.driver";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";

const SHEETS = [
  {
    name: "Orders",
    rows: [
      ["sku", "qty", "at", "note"],
      ["A-1", 2, new Date("2026-03-01T00:00:00Z"), null],
    ],
  },
  { name: "Lines", rows: [["sku"], ["B-1"], ["B-2"]] },
];

async function rowsOf(rows: AsyncIterable<TabularRow>): Promise<TabularRow[]> {
  const out: TabularRow[] = [];
  for await (const row of rows) out.push(row);
  return out;
}

describe("MemoryTabularReaderDriver", () => {
  it("yields every sheet, header first, cells as text", async () => {
    const reader = new MemoryTabularReaderDriver(SHEETS);
    expect(reader).toBeInstanceOf(TabularReader);
    const rows = await rowsOf(reader.read([]));
    expect(rows[1]).toEqual({
      sheet: "Orders",
      row: 2,
      cells: ["A-1", "2", "2026-03-01T00:00:00.000Z", ""],
    });
    expect(rows.map((row) => `${row.sheet}:${row.row}`)).toEqual([
      "Orders:1",
      "Orders:2",
      "Lines:1",
      "Lines:2",
      "Lines:3",
    ]);
  });

  it("reads only the sheets asked for", async () => {
    const rows = await rowsOf(
      new MemoryTabularReaderDriver(SHEETS).read([], { sheets: ["Lines"] }),
    );
    expect(rows.every((row) => row.sheet === "Lines")).toBe(true);
  });

  it("refuses past the row limit across sheets, headers excluded", async () => {
    const reader = new MemoryTabularReaderDriver(SHEETS);
    expect(await rowsOf(reader.read([], { limits: { rows: 3 } }))).toHaveLength(5);
    await expect(rowsOf(reader.read([], { limits: { rows: 2 } }))).rejects.toBeInstanceOf(
      TransferLimitExceededError,
    );
  });
});
