/**
 * Stackra file contract:
 * Purpose: unit tests of `XlsxWriterDriver`: a two-sheet workbook with Arabic text, numbers and dates that exceljs
 *          opens with the same sheets and values, and its media type.
 * Boundary: test only; the workbook is checked with exceljs's in-memory reader.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";
import ExcelJS from "exceljs";

import { XlsxWriterDriver } from "#core/drivers/xlsx-writer.driver";

describe("XlsxWriterDriver", () => {
  it("writes a multi-sheet workbook", async () => {
    const date = new Date("2026-10-25T00:00:00.000Z");
    const chunks: Uint8Array[] = [];
    for await (const chunk of new XlsxWriterDriver().write([
      {
        name: "المنتجات",
        rows: [
          ["الاسم", "السعر"],
          ["قلم", 5],
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
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.concat(chunks));
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["المنتجات", "Dates"]);
    expect(workbook.getWorksheet("المنتجات")?.getRow(2).values).toEqual([undefined, "قلم", 5]);
    expect(workbook.getWorksheet("Dates")?.getCell("A2").value).toEqual(date);
  });

  it("names the OOXML media type", () => {
    expect(new XlsxWriterDriver().mediaType).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  });
});
