/**
 * Stackra file contract:
 * Purpose: unit tests of `XlsxWriterDriver`: a two-sheet workbook with Arabic text, numbers and dates whose parts
 *          unzip to the expected workbook and cells, read back with the same sheets and values, and its media type.
 * Boundary: test only; the workbook is checked with `readZip` and `XlsxReaderDriver`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularRow } from "#contracts/types/tabular-row.type";
import { XLSX_CEILINGS } from "#node/constants/xlsx-ceilings.constant";
import { XlsxReaderDriver } from "#node/drivers/xlsx-reader.driver";
import { readZip } from "#node/functions/read-zip.function";
import { XlsxWriterDriver } from "#node/drivers/xlsx-writer.driver";

describe("XlsxWriterDriver", () => {
  it("writes a multi-sheet workbook", async () => {
    const date = new Date("2026-10-25T13:45:30.000Z");
    const chunks: Uint8Array[] = [];
    for await (const chunk of new XlsxWriterDriver().write([
      {
        name: "المنتجات",
        rows: [
          ["الاسم", "السعر"],
          ["قلم <&>", 5],
          [null, false],
        ],
      },
      {
        name: "Dates",
        rows: (async function* () {
          yield ["at"];
          yield [date];
        })(),
      },
    ]))
      chunks.push(chunk);
    const bytes = Buffer.concat(chunks);

    const file = readZip(bytes, XLSX_CEILINGS);
    const text = (name: string) => new TextDecoder().decode(file(name));
    expect(text("xl/workbook.xml")).toContain('<sheet name="المنتجات" sheetId="1" r:id="rId1"/>');
    expect(text("xl/worksheets/sheet1.xml")).toContain('<c r="B2"><v>5</v></c>');

    const rows: TabularRow[] = [];
    for await (const row of new XlsxReaderDriver().read([bytes])) rows.push(row);
    expect(rows).toEqual([
      { sheet: "المنتجات", row: 1, cells: ["الاسم", "السعر"] },
      { sheet: "المنتجات", row: 2, cells: ["قلم <&>", "5"] },
      { sheet: "المنتجات", row: 3, cells: ["", "false"] },
      { sheet: "Dates", row: 1, cells: ["at"] },
      { sheet: "Dates", row: 2, cells: ["2026-10-25T13:45:30.000Z"] },
    ]);
  });

  it("names the OOXML media type", () => {
    expect(new XlsxWriterDriver().mediaType).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  });
});
