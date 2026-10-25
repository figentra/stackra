/**
 * Stackra file contract:
 * Purpose: unit tests of `previewTabular`: the header and first rows of a CSV file, stopping early, and of each sheet
 *          of a multi-sheet reader; a bad row count is refused.
 * Boundary: test only; the multi-sheet reader is a stand-in driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 5).
 */
import { Driver } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { TabularReader } from "#contracts/ports/tabular-reader.port";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import { CsvReaderDriver } from "#core/drivers/csv-reader.driver";
import { previewTabular } from "#core/functions/preview-tabular.function";

class TwoSheetReader extends Driver(TabularReader) {
  async *read(): AsyncGenerator<TabularRow> {
    for (const sheet of ["A", "B"])
      for (let row = 1; row <= 4; row += 1) yield { sheet, row, cells: [`${sheet}${row}`] };
  }
}

describe("previewTabular", () => {
  it("keeps the first rows of a CSV file", async () => {
    const file = new TextEncoder().encode("name,price\na,1\nb,2\nc,3\n");
    expect(await previewTabular(new CsvReaderDriver(), [file], { rows: 2 })).toEqual({
      sheets: [
        {
          name: "",
          header: ["name", "price"],
          rows: [
            ["a", "1"],
            ["b", "2"],
          ],
        },
      ],
    });
  });

  it("keeps the first rows of each sheet", async () => {
    const preview = await previewTabular(new TwoSheetReader(), [], { rows: 1 });
    expect(preview.sheets).toEqual([
      { name: "A", header: ["A1"], rows: [["A2"]] },
      { name: "B", header: ["B1"], rows: [["B2"]] },
    ]);
  });

  it("refuses a bad row count", async () => {
    await expect(previewTabular(new TwoSheetReader(), [], { rows: -1 })).rejects.toThrow(
      RangeError,
    );
  });
});
