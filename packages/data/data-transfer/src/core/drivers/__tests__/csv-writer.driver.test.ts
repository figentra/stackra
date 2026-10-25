/**
 * Stackra file contract:
 * Purpose: unit tests of `CsvWriterDriver`: BOM, CRLF, quoting and the formula guard by default, the options turning
 *          them off, a round trip through `CsvReaderDriver`, and the one-sheet refusal.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 2 and 10).
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import type { TabularWriteOptions } from "#contracts/types/tabular-write-options.type";
import { CsvReaderDriver } from "#core/drivers/csv-reader.driver";
import { CsvWriterDriver } from "#core/drivers/csv-writer.driver";

async function bytes(sheets: TabularSheet[], options?: TabularWriteOptions): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of new CsvWriterDriver().write(sheets, options)) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const SHEET: TabularSheet = {
  name: "Orders",
  rows: [
    ["الاسم", "ملاحظة"],
    ["قلم", '=1+1, "x"'],
    [null, 5],
  ],
};

describe("CsvWriterDriver", () => {
  it("writes a BOM, CRLF, quoting and guarded formulas", async () => {
    const file = await bytes([SHEET]);
    expect([...file.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(file)).toBe('الاسم,ملاحظة\r\nقلم,"\'=1+1, ""x"""\r\n,5\r\n');
    expect(new CsvWriterDriver().mediaType).toBe("text/csv");
  });

  it("follows its options", async () => {
    const file = await bytes([SHEET], {
      delimiter: ";",
      byteOrderMark: false,
      formulaGuard: false,
    });
    expect(file[0]).not.toBe(0xef);
    expect(new TextDecoder().decode(file)).toContain('قلم;"=1+1, ""x"""');
  });

  it("round-trips through the reader", async () => {
    const cells: string[][] = [];
    for await (const row of new CsvReaderDriver().read([
      await bytes([SHEET], { formulaGuard: false }),
    ]))
      cells.push([...row.cells]);
    expect(cells).toEqual([
      ["الاسم", "ملاحظة"],
      ["قلم", '=1+1, "x"'],
      ["", "5"],
    ]);
  });

  it("refuses anything but one sheet", async () => {
    await expect(bytes([])).rejects.toThrow(TypeError);
    await expect(bytes([SHEET, SHEET])).rejects.toThrow(TypeError);
  });
});
